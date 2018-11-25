const debug = require('debug')('leah-test')
const path = require('path')
const fs = require('fs')
const globby = require('globby')
const changedFiles = require('jest-changed-files')
const dargs = require('dargs')
const cp = require('child_process')

exports.unparseArgv = (argv, options = {}) => {
  // revert argv object to array
  // yargs will paser `debug-brk` to `debug-brk` and `debugBrk`, so we need to filter
  return [ ...new Set(unparse(argv, options)) ]
}

async function getChangedFiles() {
  const cwd = process.cwd()
  const res = await changedFiles.getChangedFilesForRoots([ cwd ])
  const changedFiles = res.changedFiles
  const files = []
  for (const file of changedFiles) {
    // only find ${cwd}/test/**/*.test.(js|ts)
    if (file.startsWith(path.join(cwd, 'test')) && file.match(/\.test\.(js|ts)$/)) {
      files.push(file)
    }
  }
  return files
}

/*
argv = {
  _: [],
  typescript: undefined,
  ts: undefined,
  '$0': undefined,
  help: undefined,
  h: undefined,
  version: undefined,
  v: undefined,
  r: undefined,
  g: undefined,
  t: undefined,
  c: undefined
}
 */
async function genMochaArgs(argv) {
  const testArgv = Object.assign({}, argv)
  /* istanbul ignore next */
  testArgv.timeout = testArgv.timeout || process.env.TEST_TIMEOUT || 60000
  testArgv.reporter = testArgv.reporter || process.env.TEST_REPORTER
  // force exit
  // testArgv.exit = true
  // collect require
  let requireArr = []
  if (testArgv.require) {
    if (Array.isArray(testArgv.require)) {
      requireArr = testArgv.require
    } else {
      requireArr = [testArgv.require]
    }
  }
  // clean mocha stack, inspired by https://github.com/rstacruz/mocha-clean
  // [mocha built-in](https://github.com/mochajs/mocha/blob/master/lib/utils.js#L738)
  // don't work with `[npminstall](https://github.com/cnpm/npminstall)`, so we will override it.
  if (!testArgv.fullTrace) {
    requireArr.unshift(require.resolve('../mocha-clean'))
  }
  requireArr.push(require.resolve('co-mocha'))
  requireArr.push(require.resolve('intelli-espower-loader'))
  // for power-assert
  if (testArgv.typescript) {
    // remove ts-node in context getter on top.
    requireArr.push(require.resolve('espower-typescript/guess'))
  }
  testArgv.require = [...new Set(requireArr)]
  let pattern
  // changed
  if (testArgv.changed) {
    pattern = await getChangedFiles().then
    if (!pattern.length) {
      console.log('No changed test files')
      return
    }
  }
  if (!pattern) {
    // specific test files
    pattern = testArgv._.slice()
  }
  if (!pattern.length && process.env.TESTS) {
    pattern = process.env.TESTS.split(',')
  }
  // collect test files
  if (!pattern.length) {
    pattern = [ `test/**/*.test.${testArgv.typescript ? 'ts' : 'js'}` ]
  }
  pattern = pattern.concat(['!test/fixtures', '!test/node_modules'])
  // expand glob and skip node_modules and fixtures
  const files = globby.sync(pattern)
  files.sort()
  if (files.length === 0) {
    console.log(`No test files found with ${pattern}`)
    return
  }
  testArgv._ = files
  return [...new Set(dargs(testArgv))]
}

// only hook once and only when ever start any child.
const childs = new Set()
let hadHook = false
function gracefull(proc) {
  // save child ref
  childs.add(proc)

  // only hook once
  /* istanbul ignore else */
  if (!hadHook) {
    hadHook = true
    let signal
    [ 'SIGINT', 'SIGQUIT', 'SIGTERM' ].forEach(event => {
      process.once(event, () => {
        signal = event
        process.exit(0)
      })
    })

    process.once('exit', () => {
      // had test at my-helper.test.js, but coffee can't collect coverage info.
      for (const child of childs) {
        debug('kill child %s with %s', child.pid, signal)
        child.kill(signal)
      }
    })
  }
}

function forkNode(modulePath, args = [], options = {}) => {
  options.stdio = options.stdio || 'inherit'
  debug('Run fork `%s %s %s`', process.execPath, modulePath, args.join(' '))
  const proc = cp.fork(modulePath, args, options)
  gracefull(proc)

  return new Promise((resolve, reject) => {
    proc.once('exit', code => {
      childs.delete(proc)
      if (code !== 0) {
        const err = new Error(modulePath + ' ' + args + ' exit with code ' + code)
        err.code = code
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

async function run(args) {
  const mochaFile = require.resolve('mocha/bin/_mocha')
  const testArgs = await formatTestArgs(args)
  if (!testArgs) {
    return
  }
  debug('run test: %s %s', mochaFile, testArgs.join(' '))
  forkNode(mochaFile, testArgs)
}
