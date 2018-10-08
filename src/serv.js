'use strict'

const cp = require('child_process')
const debug = require('debug')('hot-dev:serv')
const chalk = require('chalk')

const log = require('./utils.js').log

function node(entry) {
  let subProcess
  let reloading = false
  let reloadPedding = false

  function fork() {
    const newProcess = cp.fork(entry)
    if (subProcess && subProcess.pid) {
      log(
        chalk.gray(`child process[pid = ${subProcess.pid}] exited, ` +
        `child process[pid = ${newProcess.pid}] forked`)
      )
    }
    newProcess.on('exit', (code, signal) => {
      if (code > 0 || signal !== 'SIGTERM') {
        const msg = `child process[pid = ${newProcess.pid}] exited ` +
          `with code = ${code}, signal = ${signal}`
        log(chalk.redBright(msg))
      }
    })
    return newProcess
  }

  debug('node entry is %s', entry)

  return node = {
    start() {
      subProcess = fork()
      debug('entry process has forked')
    },
    reload() {
      if (reloading) {
        debug('reloadPedding')
        reloadPedding = true
        return
      }
      reloading = true
      const newProcess = fork()
      debug('entry process has reloaded')
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
    },
    exit(signal) {
      if (subProcess) {
        subProcess.kill(signal)
        log(chalk.redBright(
          `\nchild process[pid = ${subProcess.pid}] exited ` +
          `with signal = ${signal}`
        ))
      }
    }
  }
}

exports = module.exports = node
