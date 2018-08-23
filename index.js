'use strict'

const debug = require('debug')('hot-dev')
const watch = require('./src/watch.js')

const watcher = watch(__dirname, {
  // usePolling: true,
  ignoreInitial: true,
}, ['add', 'addDir', 'change', 'unlink', 'unlinkDir', 'error', 'ready'])

let signal
[ 'SIGINT', 'SIGQUIT', 'SIGTERM' ].forEach(event => {
  process.once(event, () => {
    signal = event
    process.exit(0)
  })
})

process.once('exit', () => {
  debug('kill hot-dev:%s with %s', watcher.pid, signal);
  watcher.close()
  // watcher.kill(signal)
})
