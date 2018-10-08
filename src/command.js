'use strict'

const fs = require('fs')
const path = require('path')
const os = require('os')
const chalk = require('chalk')
const debug = require('debug')('hot-dev:command')
const yaml = require('js-yaml')

const log = require('./utils.js').log
const watch = require('./watch.js')


function defaultConfig() {
  return {
    paths: [process.cwd()],
    options: {
      persistent: true,
      ignored: [
        '**/node_modules/**',
        '**/node_modules/\.**',
        '**/\.git/**',
      ],
      ignoreInitial: true,
      followSymlinks: true,
      cwd: null,
      disableGlobbing: false,
      usePolling: true,
      interval: 100,
      binaryInterval: 300,
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
      'ready',
      'change',
      'add',
      'addDir',
      'unlink',
      'unlinkDir',
      'error',
    ]
  }
}

function readFrom(file) {
  debug('try read file: %s', file)
  let content = false
  try {
    content = yaml.safeLoad(fs.readFileSync(file, 'utf8'))
  } catch (e) {
    debug('read file: %s field', file)
  }
  return content
}

function getDftConfig(filePath) {
  let content = false
  if (filePath === undefined) {
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
    if (!content) {
      log(chalk.yellow(
        'read field from hot-dev config file, ' +
        'it will use defaultConfig'
      ))
      content = defaultConfig()
    }
  } else {
    content = readFrom(filePath)
    if (!content) {
      log(chalk.yellow(
        `read field from ${chalk.underline(filePath)}, ` +
        'it will use defaultConfig'
      ))
      content = defaultConfig()
    }
  }
  return content
}

function getEntry(filePath) {
  if (filePath === undefined) {
    const tryFiles = [
      path.resolve('index.js'),
      path.resolve('Index.js'),
      path.resolve('app.js'),
      path.resolve('App.js'),
      path.resolve('start.js'),
      path.resolve('Start.js'),
      path.resolve('master.js'),
      path.resolve('Master.js'),
    ]
    let i = 0
    while (i < tryFiles.length) {
      if (fs.existsSync(tryFiles[i])) {
        filePath = tryFiles[i]
        break
      }
      i += 1
    }
    if (!filePath) {
      log(chalk.red(`can't find entry file in ${chalk.underline(process.cwd())}`))
      log(chalk.yellowBright(
        '\n  please use -f <filePath> to specify a entry file\n' +
          '  or touch a file with one of the following names in this directory: \n'
      ))
      log(
        '    index.js\n' +
        '    Index.js\n' +
        '    app.js\n' +
        '    App.js\n' +
        '    start.js\n' +
        '    Start.js\n' +
        '    master.js\n' +
        '    Master.js\n'
      )
      return false
    }
  } else {
    if (!path.isAbsolute(filePath)) {
      filePath = path.resolve(filePath)
      log(filePath)
    }
    if (!fs.existsSync(filePath)) {
      const dir = path.dirname(filePath)
      const baseName = path.basename(filePath)
      log(chalk.red(
        `can't find entry file(${chalk.underline(baseName)})` +
        ` in ${chalk.underline(dir)}, ` +
        'please specify another file'
      ))
      return false
    }
  }
  return filePath
}

function genConfig(config, entry, watches, excludes, exOptions, events) {
  const options = config && config.options || {}
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
  config.options = options
  if (Array.isArray(watches) && watches.length > 0) {
    config.paths = watches
  }
  if (Array.isArray(events) && events.length > 0) {
    config.events = events
  }
  config.entry = entry
  return config
}

exports.start = function start(configPath, entryPath, watches, excludes, options, events) {
  const dftConf = getDftConfig(configPath)
  const entry = getEntry(entryPath)
  if (entry) {
    const config = genConfig(dftConf, entry, watches, excludes, options, events)
    watch(config)
  }
}

exports.getConfigFile = function getConfigFile(filePath) {
  if (!path.isAbsolute(filePath)) {
    filePath = path.join(process.cwd(), filePath)
  }
  const ext = path.extname(filePath)
  if (!ext || (ext !== 'yml' && ext !== 'yaml')) {
    if (fs.existsSync(filePath + '.yaml')) {
      return filePath + '.yaml'
    }
    if (fs.existsSync(filePath + '.yml')) {
      return filePath + '.yaml'
    }
    if (fs.existsSync(filePath + '.rc')) {
      return filePath + '.rc'
    }
  }
  if (fs.existsSync(filePath)) {
    return filePath
  }
  log(chalk.red(`configuration file: '${chalk.underline(filePath)}' not exist`))
  return false
}

exports.getEntryFile = function getEntryFile(filePath) {
  if (!path.isAbsolute(filePath)) {
    filePath = path.join(process.cwd(), filePath)
  }
  const ext = path.extname(filePath)
  if (!ext || ext !== '.js') {
    filePath += '.js'
  }
  if (fs.existsSync(filePath)) {
    return filePath
  }
  log(chalk.red(`entry file: '${chalk.underline(filePath)}' not exist`))
  return false
}

exports.getWathPath = function getWathPath(pattern, value) {

}

exports.getOptions = function getOptions(option, value) {

}

exports.getEvents = function getEvents(event, value) {

}
