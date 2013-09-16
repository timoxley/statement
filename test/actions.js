"use strict"

var test = require('tape')
var Machine = require('../')

var states = {
  Disabled: {
    enable: 'Enabled'
  },
  Enabled: {
    disable: 'Disabled',
  },
}

test('actions transition to other states', function(t) {
  t.plan(1)
  var machine = new Machine(states, 'Disabled', function() {
    machine.trigger('enable')
    t.equal(machine.state.name, 'Enabled')
  })
})

test('actions pass arguments', function(t) {
  t.plan(1)
  var expected = {}
  var machine = new Machine(states, 'Disabled', function() {
    machine.trigger('enable', expected)
  })

  machine.on('enter Enabled', function(actual) {
    t.equal(expected, actual)
  })
})
