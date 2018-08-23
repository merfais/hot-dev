#!/usr/bin/env node

/**
 * Module dependencies.
 */

var program = require('commander');

program
  .version('0.1.0')
  .option('-f, --foo <arg> [args]', 'enable some foo', (a, v) => {console.log('foo', a, v)})
  .option('-b, --bar [name]=[value]', 'enable some bar', (n, v) => {console.log('bar', n, v)})
  .option('-B, --baz', 'enable some baz', v => {console.log('baz', v)})
  .option('-r, --range <a>..<b>', 'A range', range)

function range(val) {
  console.log(val)
}

// must be before .parse() since
// node's emit() is immediate

program.on('--help', function(){
  console.log('  Examples:');
  console.log('');
  console.log('    $ custom-help --help');
  console.log('    $ custom-help -h');
  console.log('');
});

program.parse(process.argv);

console.log(program.foo)

console.log(process.argv);
