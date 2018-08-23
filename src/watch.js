'use strict'

const debug = require('debug')('hot-dev')
const chalk =require('chalk')
const  chokidar = require('chokidar')

const eventsHandler = {
  add(...args) {
    console.log('=========================================> add', args.length)
    console.log(...args)
  },
  addDir(...args) {
    console.log('=========================================> addDir', args.length)
    console.log(...args)

  },
  change(...args) {
    console.log('=========================================> change', args.length)
    console.log(...args)

  },
  unlink(...args) {
    console.log('=========================================> unlink', args.length)
    console.log(...args)

  },
  unlinkDir(...args) {
    console.log('=========================================> unlinkDir', args.length)
    console.log(...args)

  },
  ready(...args) {
    console.log('=========================================> ready', args.length)
    console.log(...args)

  },
  raw(...args) {
    console.log('=========================================> raw', args.length)
    console.log(...args)

  },
  error(...args) {
    console.log('=========================================> error', args.length)
    console.log(...args)
  },
}


function watch(paths, options = {}, events = ['change']) {
  console.log(chalk.green('start wathing...'))
  debug('paths: %j', paths)
  debug('options: %j', options)
  debug('events: %s', events)
  const watcher = chokidar.watch(paths, options)
  let i = 0
  while (i < events.length) {
    const name = events[i]
    console.log(name, eventsHandler[name])
    if (eventsHandler[name]) {
      watcher.on(name, eventsHandler[name])
    }
    i += 1
  }

  return watcher
}

exports = module.exports = watch
