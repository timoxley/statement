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

test('enter state events get a "context"', function(t) {
  t.plan(5)
  var disabledContext = undefined
  var enabledContext = undefined
  var machine = new Machine(states, 'Disabled', function() {
    this.someData = true
    disabledContext = this
    machine.trigger('enable')
  })

  machine.once('enter Enabled', function() {
    enabledContext = this
    machine.once('enter Disabled', function() {
      t.ok(enabledContext)
      t.notEqual(enabledContext, disabledContext)
      t.equal(disabledContext, this)
      t.equal(this.emit, enabledContext.emit)
      t.ok(disabledContext.someData)
    })
    machine.trigger('disable')
  })
})



