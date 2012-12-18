var Machine = require('state-machine')
var assert = require('timoxley-assert')

function Button() {

}

Button.prototype.isButton = true

var ButtonMachine = Machine({
  'Inactive': {
    activate: 'Active'
  },
  'Active': {
    deactivate: 'Inactive'
  }
})

describe('use as a constructor', function() {
  var machine
  beforeEach(function() {
    machine = new ButtonMachine()
  })
  it('starts in first state', function() {
    assert.equal(machine.state, 'Inactive')
  })
  it('has functions for each state', function() {
    assert.equal(typeof machine.activate, 'function')
    assert.equal(typeof machine.deactivate, 'function')
  })
  it('can move to next state', function() {
    machine.activate()
    assert.equal(machine.state, 'Active')
  })
  it('fires events on enter state', function(done) {
    machine.on('enterActive', done)
    machine.activate()
  })
  it('fires events on leave state', function(done) {
    machine.on('leaveInactive', done)
    machine.activate()
  })
  it('emits "invalidAction" when calling actions not in current state', function(done) {
    machine.on('invalidAction', done.bind(this, null))
    machine.activate()
    machine.activate()
  })
})

describe.only('sub states', function() {
  var FanControl = Machine({
    'Inactive': {
      activate: 'Active'
    },
    'Active': {
      deactivate: 'Inactive',
      'Low': {
        more: 'High',
        greater: 'High'
      },
      'High': {
        less: 'Low'
      }
    }
  })
  var fan
  beforeEach(function() {
    fan = new FanControl()
  })
  it('gets substate function names', function() {
      assert.equal(typeof fan.activate, 'function')
      assert.equal(typeof fan.deactivate, 'function')
      assert.equal(typeof fan.more, 'function')
      assert.equal(typeof fan.less, 'function')

  })
  it('can transition to sub states', function() {
    fan.activate()
    assert.equal(fan.state, 'Active.Low')
  })
})
