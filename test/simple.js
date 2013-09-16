"use strict"

var test = require('tape')
var Machine = require('../')

var machine = new Machine({
  Disabled: {
    enable: 'Enabled'
  },
  Enabled: {
    disable: 'Disabled',
  },
  'Enabled.Low': {
    faster: 'High'
  },
  'Enabled.High': {
    slower: 'Low'
  }
}, 'Disabled')

machine.trigger('enable')

console.log(require('util').inspect(machine, { showHidden: true, depth: null, colors: true}))

test('initial state', fi)
