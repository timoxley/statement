"use strict"

var test = require('tape')
var Machine = require('../')

var states = {
  Disabled: {
    enable: 'Enabled'
  },
  Enabled: {
    disable: 'Disabled'
  }
}

test('initial state', function(t) {
  t.plan(2)
  var machine1 = new Machine(states,  'Disabled')
  var machine2 = new Machine(states,  'Enabled')

  setTimeout(function() {
    t.equal(machine1.state.name, 'Disabled')
    t.equal(machine2.state.name, 'Enabled')
  }, 100)
})

test('initial state event', function(t) {
  t.plan(1)
  var machine = new Machine(states, 'Disabled')
  machine.on('enter Disabled', function() {
    t.equal(machine.state.name, 'Disabled')
  })
})


test('initial state callback', function(t) {
  t.plan(1)
  var machine = new Machine(states,  'Disabled', function() {
    t.equal(machine.state.name, 'Disabled')
  })
})
