'use strict'

const debug = require('debug')('hot-dev')
const path = require('path')
const fs = require('fs')
const os = require('os')
const yaml = require('js-yaml')

const watch = require('./watch.js')

function defaultConfig() {
  return {
    paths: [__dirname],
    options: {
      persistent: true,
      ignored: '',
      ignoreInitial: true,
      followSymlinks: true,
      cwd: '',
      disableGlobbing: false,
      usePolling: true,
      interval: 100,
      binaryInterval:300,
      useFsEvents: true,
      alwaysStat: true,
      depth: 99,
      awaitWriteFinish: {
        stabilityThreshold: 2000,
        pollInterval: 100,
      },
      ignorePermissionErrors: false,
      atomic: 100,
    },
    events: [
      'change',
    ]
  }
}

function readFrom(file) {
  debug('try read file: %s' file)
  let content = false
  try {
    content = yaml.safeLoad(fs.readFileSync(file, 'utf8'))
  } catch (e) {
    debug('read file: %s field', file)
  }
  return content
}

function getConfig(path) {
  let content = false
  if (path === undefined) {
    const tryFiles = [
      path.resolve('.hot-dev.yaml'),
      path.resolve('hot-dev.yaml'),
      path.resolve('.hot-dev.yml'),
      path.resolve('hot-dev.yml'),
      path.resolve('.hot-dev.rc'),
      path.resolve('hot-dev.rc'),
      path.resolve(os.homedir(), '.hot-dev.yaml'),
      path.resolve(os.homedir(), 'hot-dev.yaml'),
      path.resolve(os.homedir(), '.hot-dev.yml'),
      path.resolve(os.homedir(), 'hot-dev.yml'),
      path.resolve(os.homedir(), '.hot-dev.rc'),
      path.resolve(os.homedir(), 'hot-dev.rc'),
    ]
    let i = 0
    while (i < tryFiles.length) {
      content = readFrom(tryFiles[i])
      if (content) {
        break;
      }
      i += 1
    }
  } else {
    content = readFrom(path)
  }
  if (!content) {
    content = defaultConfig()
  }
  return content
}

function getEntry(path) {
  if (path === undefined) {
    const tryFiles = [
      path.resolve('index.js')
      path.resolve('Index.js')
      path.resolve('app.js')
      path.resolve('App.js')
      path.resolve('start.js')
      path.resolve('Start.js')
      path.resolve('master.js')
      path.resolve('Master.js')
    ]
    let i = 0
    while (i < tryFiles.length) {
      if (fs.existsSync(tryFiles[i])) {
        path = tryFiles[i]
        break
      }
      i += 1
    }
    if (!path) {
      console.log(chalk.red(`can't find entry file in ${chalk.underline(__dirname)}`))
      console.log(chalk.greenBright(
        '    please use -f <filePath> to specify a entry file' +
        'or touch a file with following names in this directory: \n' +
        '    index.js\n' +
        '    Index.js\n' +
        '    app.js\n' +
        '    App.js\n' +
        '    start.js\n' +
        '    Start.js\n' +
        '    master.js\n' +
        '    Master.js\n'
      ))
      return false
    }
  } else {
    if (!path.isAbsolute(path)) {
      path = path.resolve(path)
    }
    if (!fs.existsSync(path)) {
      const dir = path.dirname(path)
      const baseName = path.basename(path)
      console.log(chalk.red(
        `can't find entry file(${chalk.underline(baseName)})` +
        ` in ${chalk.underline(dir)}, ` +
        'please specify another file'
      ))
      return false
    }
  }
  return path
}

function genOptions(content, watches, excludes, exOptions, events) {
  const options = content && content.options || {}
  if (Object.prototype.toString.call(exOptions) === '[object Object]') {
    const awaitWriteFinish = exOptions.awaitWriteFinish
    const stabilityThreshold = exOptions.stabilityThreshold
    const pollInterval = exOptions.pollInterval
    delete exOptions.awaitWriteFinish
    delete exOptions.stabilityThreshold
    delete exOptions.pollInterval
    const keys = Object.keys(exOptions)
    let i = 0
    while (i < keys.length) {
      options[keys[i]] = exOptions[keys[i]]
      i += 1
    }
    if (awaitWriteFinish === false) {
      options.awaitWriteFinish = false
    } else if (awaitWriteFinish === true) {
      options.awaitWriteFinish = true
    } else {
      options.awaitWriteFinish = {}
      if (stabilityThreshold !== undefined) {
        options.awaitWriteFinish.stabilityThreshold = stabilityThreshold
      }
      if (pollInterval !== undefined) {
        options.awaitWriteFinish.pollInterval = pollInterval
      }
    }
  }
  if (Array.isArray(excludes) && excludes.length > 0) {
    options.ignored = excludes
  }
  content.options = options
  if (Array.isArray(watches) && watches.length > 0) {
    content.paths = watches
  }
  if (Array.isArray(events) && events.length > 0) {
    content.events = events
  }
  return content
}

function start(configPath, entryPath, watches, excludes, exOptions, events) {
  const content = readFrom(configPath)
  const options = genOptions(content, watches, excludes, exOptions, events)
  const entry = getEntry(entryPath)
  if (entry) {

  }
  const watcher = watch(options)
  return watcher
}

exports = module.exports = start
