'use strict'

const debug = require('debug')('hot-dev')
const chalk = require('chalk')
const commander = require('commander')

const pkg = require('../package.json')

commander
  .version(pkg.version, '-v --version')
  .option('-c --config <filePath>', 'path to the config file', getConfigFile)
  .option('-o --option [name]=[value]')
