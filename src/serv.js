'use strict'

const cp = require('child_process')
const debug = require('debug')('hot-dev')
const chalk = require('chalk')

const log = require('./utils.js').log

function node(entry) {
  let subProcess
  let reloading = false
  let reloadPedding = false

  function fork() {
    const newProcess = cp.fork(entry)
    log(chalk.greenBright(`fork child process[pid = ${newProcess.pid}]`))
    newProcess.on('exit', (code, signal) => {
      log(chalk.redBright(
        `child process[pid = ${newProcess.pid}] exited ` +
        `with code = ${code}, signal = ${signal}`
      ))
    })
    return newProcess
  }

  debug('node entry is %s', entry)

  return node = {
    start() {
      subProcess = fork()
    },
    reload() {
      if (reloading) {
        debug('reloadPedding')
        reloadPedding = true
        return
      }
      reloading = true
      const newProcess = fork()
      if (subProcess) {
        subProcess.kill()
      }
      subProcess = newProcess
      reloading = false
      if (reloadPedding) {
        debug('reloadPedding happened, reload again')
        reloadPedding = false
        node.reload()
      }
    }
  }
}

exports = module.exports = node
