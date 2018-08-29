'use strict'

const debug = require('debug')('hot-dev')
const chalk =require('chalk')
const chokidar = require('chokidar')
const serv = require('./serv.js')
const {
  log,
  dateFormate
} = require('./utils.js')

function logState(action, path, time) {
  const pad = Array(10 - action.length).join(' ')
  log(
    chalk.blue(pad + action + ': ') +
    path +
    (time ? chalk.bold(' @ ') + chalk.greenBright(time) : '')
  )
}

function getEventHandler(name, node) {
  if (name === 'ready') {
    return () => {
      log(chalk.greenBright.bold('ready for watching...'))
      node.start()
    }
  } else if (name === 'change' || name === 'add' || name === 'addDir') {
    return (path, stats) => {
      logState(name, path, dateFormate(stats.mtime))
      node.reload()
    }
  } else if (name === 'unlink' || name === 'unlinkDir') {
    return path => {
      logState(name, path)
      node.reload()
    }
  } else if (name === 'error') {
    return (...args) => {
      log(chalk.red('Error was occured:'))
      log(...args)
    }
  } else if (name === 'raw') {
    return (action, path) => {
      log('raw[' + action + '] : ' + path)
    }
  }
}

function watch({
  entry = 'index.js',
  paths = [process.cwd()],
  options = {},
  events = ['change']
}) {
  log(chalk.greenBright('entry file: '), entry)
  log(chalk.greenBright('watching paths: '), JSON.stringify(paths, null, 2))
  log(chalk.greenBright('watching options: '), JSON.stringify(options, null, 2))
  log(chalk.greenBright('wathing events: '), JSON.stringify(events, null, 2))
  log(chalk.greenBright.bold('\nstart wathing...'))

  const node = serv(entry)
  const watcher = chokidar.watch(paths, options)
  let i = 0
  while (i < events.length) {
    const name = events[i]
    watcher.on(name, getEventHandler(name, node))
    i += 1
  }

  const signals = ['SIGINT', 'SIGQUIT', 'SIGTERM']
  signals.forEach(signal => {
    process.once(signal, () => {
      process.exit(signal)
    })
  })

  process.once('exit', (signal) => {
    log()
    debug('kill hot-dev:%s with %s', watcher.pid, signal);
    watcher.close()
  })
}

exports = module.exports = watch
