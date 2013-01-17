"use strict"

var assert = require('timoxley-assert')

var Machine = require('state-machine')
var State = Machine.State
var Action = Machine.Action

describe('State', function() {
  it('works', function() {
    var state = new State({
      name: 'Active'
    })
    assert(state instanceof State)
  })

  describe('adding actions', function() {
    var disabledState, enabledState, action
    beforeEach(function() {
      disabledState = new State({
        name: 'Disabled'
      })
      enabledState = new State({
        name: 'Enabled'
      })
      action = new Action({
        name: 'enable',
        target: enabledState
      })
    })

    it('should add actions', function() {
      assert(!disabledState.hasAction(action))
      disabledState.addAction(action)
      assert(disabledState.hasAction(action))
    })

    it('can get actions', function() {
      disabledState.addAction(action)
      assert.strictEqual(action, disabledState.getAction(action))
      assert.strictEqual(action, disabledState.getAction(action.name))
    })
  })
})
describe('Machine Operations', function() {
  var machine, disabledState, enabledState, action
  beforeEach(function() {
    disabledState = new State({
      name: 'Disabled'
    })
    enabledState = new State({
      name: 'Enabled'
    })
    action = new Action({
      name: 'enable',
      target: enabledState
    })
    disabledState.addAction(action)
    machine = new Machine()
  })

  describe('with no states', function() {
    it('can add states', function() {
      machine.addState(disabledState)
      machine.hasState(disabledState)
    })
  })
  describe('with states', function() {
    beforeEach(function() {
      machine.addState(disabledState)
      machine.addState(enabledState)
    })

    it('has an initial state', function() {
      assert.strictEqual(machine.getState(), disabledState)
    })

    it('can set state', function() {
      machine.setState(enabledState)
      assert.strictEqual(machine.getState(), enabledState)
      // test by name
      machine.setState(disabledState.name)
      assert.strictEqual(machine.getState(), disabledState)
    })
    describe('events', function() {
      it('fires "leave state.name" when leaving a state', function(done) {
        machine.once('leave Disabled', function() {
          done()
        })
        machine.trigger('enable')
      })
      it('fires "enter state.name" when entering a state', function(done) {
        machine.once('enter Enabled', function() {
          done()
        })
        machine.trigger('enable')
      })
    })

    it('sets parent of states', function() {
      assert.strictEqual(disabledState.parent, machine)
    })

    describe('triggering', function() {
      it('throws if triggering on no state', function() {
        assert.throws(function() {
          var noStatesMachine = new Machine()
          noStatesMachine.trigger('enable')
        })
      })

      it('triggering actions changes state', function() {
        machine.trigger('enable')
        assert.strictEqual(machine.getState(), enabledState)
      })
      it('does nothing if action is invalid', function() {
        machine.setState(enabledState)
        machine.trigger('enable') // does nothing, 'enable' action not defined on enabledState
        assert.strictEqual(machine.state, enabledState)
      })
    })
  })
  describe('substates', function() {
    var heatState, coolState
    beforeEach(function() {
      machine.addState(disabledState)
      machine.addState(enabledState)
      heatState = new State({
        name: 'Heating'
      })
      coolState = new State({
        name: 'Cooling'
      })
      machine.getState('Enabled')
      .addState(heatState)
      .addState(coolState)
    })
    describe('substates and setState()', function() {
      it('allows substates', function() {
        machine.setState('Enabled.Heating')
        assert.deepEqual(machine.getHeirarchy(), [enabledState, heatState])
      })
    })
    describe('getHeirarchy()', function() {
      it('provides current state heirarchy', function() {
        machine.setState('Enabled')
        .getState('Enabled')
            .setState('Heating')
        assert.deepEqual(machine.getHeirarchy(), [enabledState, heatState])
      })
    })
  })
})
