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

test('actions transition to other states', function(t) {
  t.plan(1)
  var machine = new Machine(states, 'Disabled', function() {
    machine.trigger('enable')

    machine.once('enter Enabled', function(actual) {
      t.equal(machine.state.name, 'Enabled')
    })
  })
})

test('invalid actions do not transition to other states', function(t) {
  var machine = new Machine(states, 'Disabled', function() {
    machine.trigger('disable')

    machine.once('enter Enabled', function(actual) {
      t.fail('should not transition')
    })

    setTimeout(function() {
      t.end()
    })
  })
})

test('invalid actions trigger invalidAction event with arguments', function(t) {
  t.plan(2)
  var machine = new Machine(states, 'Disabled', function() {
    var expected = {hello: true}

    machine.once('invalidAction', function(actionName, actual, what) {
      console.log('OMG', actionName, actual, what)
      t.equal(actionName, 'disable')
      t.equal(actual, expected)
    })

    machine.trigger('disable', expected)
    setTimeout(function() {}, 100) // wait
  })
})

test('actions pass arguments', function(t) {
  t.plan(1)
  var expected = {hello: true}
  var machine = new Machine(states, 'Disabled', function() {
    machine.trigger('enable', expected)
  })

  machine.on('enter Enabled', function(route, actual) {
    t.equal(expected, actual)
  })
})

test('actions pass route components', function(t) {
  t.plan(2)
  var machine = new Machine(states, 'Disabled', function() {
    machine.trigger('enable')
  })
  machine.once('enter :state', function(route) {
    t.equal(route.state, 'Disabled')
    machine.once('enter :state', function(route) {
      t.equal(route.state, 'Enabled')
    })
  })
})
