'use strict'

const debug = require('debug')('hot-dev')
const chalk = require('chalk')
const program = require('commander')
const fs = require('fs')
const path = require('path')
const pkg = require('./package.json')
const start = require('./src/command.js')

function getConfigFile(filePath) {
  if (!path.isAbsolute(filePath)) {
    filePath = path.join(__dirname, filePath)
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
  console.log(chalk.red(`configuration file: '${chalk.underline(filePath)}' not exist`))
  return false
}

function getEntryFile(filePath) {
  if (!path.isAbsolute(filePath)) {
    filePath = path.join(__dirname, filePath)
  }
  const ext = path.extname(filePath)
  if (!ext || ext !== 'js') {
    filePath += '.js'
  }
  if (fs.existsSync(filePath)) {
    return filePath
  }
  console.log(chalk.red(`entry file: '${chalk.underline(filePath)}' not exist`))
  return false
}

function getWathPath(pattern, value) {

}

function getOptions(option, value) {

}

function getEvents(event, value) {

}

program
  .version(pkg.version, '-v --version')
  .usage('[Option] [value] | <Command> [Option]')
  .option('-c --config <filePath>', 'path to the config file', getConfigFile)
  .option('-f --file <filePath>', 'path to the entry file', getEntryFile)
  .option('-w --watch <file | directory>', 'Paths to file or directory or glob pattern \n \
                                  to be watched recursively\n \
                                  use "," to split multiple pattern', getWathPath, [])
  .option('-i --exclude <file | directory>', 'exclude file or directory or glob pattern \n \
                                  to be watched \n \
                                  use "," to split multiple pattern', getWathPath, [])
  .option('-o --option <name=value>', 'set watch options \n \
                                  use "," to split multiple pattern \n \
                                  see https://github.com/paulmillr/chokidar#api', getOptions, {})
  .option('-e --event <event>', 'which event will be listened, Available events:\n \
                                  add, addDir, change, unlink, unlinkDir, ready, raw, error \n \
                                  use "," to split multiple pattern \n \
                                  see https://github.com/paulmillr/chokidar#methods--events', getEvents, [])

program
  .command('init')
  .description('create a hot-dev configuration file')
  .option('-d --default', 'skip prompts and use default preset')
  .action(cmd => {
    // TODO:
  })

program.parse(process.argv)

debug('argv.config = %s', program.config)
debug('argv.file = %s', program.file)

if (program.config !== false && program.file !== false) {
  const watcher = start(
    program.config,
    program.file,
    program.watch,
    program.exclude,
    program.option,
    program.event,
  )

  const signals = ['SIGINT', 'SIGQUIT', 'SIGTERM']
  signals.forEach(signal => {
    process.once(signal, () => {
      process.exit(signal)
    })
  })

  process.once('exit', (signal) => {
    console.log()
    debug('kill hot-dev:%s with %s', watcher.pid, signal);
    watcher.close()
    // watcher.kill(signal)
  })
}
