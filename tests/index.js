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
        name: 'Initial'
      })
      enabledState = new State({
        name: 'TargetState'
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
      name: 'Initial'
    })
    enabledState = new State({
      name: 'TargetState'
    })
    action = new Action({
      name: 'enable',
      target: enabledState
    })
    disabledState.addAction(action)
    machine = new Machine()
  })

  it('can add states', function() {
    machine.addState(disabledState)
    machine.hasState(disabledState)
  })

  it('has an initial state', function() {
    machine.addState(disabledState)
    machine.addState(enabledState)
    assert.strictEqual(machine.getState(), disabledState)
  })

  it('can set state', function() {
    machine.addState(disabledState)
    machine.addState(enabledState)
    machine.setState(enabledState)
    assert.strictEqual(machine.getState(), enabledState)
    // test by name
    machine.setState(disabledState.name)
    assert.strictEqual(machine.getState(), disabledState)
  })

  it('sets parent of states', function() {
    machine.addState(disabledState)
    assert.strictEqual(disabledState.parent, machine)
  })

  describe('triggering', function() {
    it('throws if triggering on no state', function() {
      assert.throws(function() {
        machine.trigger('enable')
      })
    })

    it('can trigger actions', function() {
      machine.addState(disabledState)
      machine.addState(enabledState)
      machine.trigger('enable')
      assert.strictEqual(machine.getState(), enabledState)
    })

    it('does nothing if action is invalid', function() {
      machine.addState(disabledState)
      machine.addState(enabledState)
      machine.trigger('enable')
      assert.strictEqual(machine.state, enabledState)
      machine.trigger('enable') // does nothing
      assert.strictEqual(machine.state, enabledState)
    })
  })
})
