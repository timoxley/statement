"use strict"

var assert = require('timoxley-assert')

var Machine = require('state-machine')
var State = Machine.State
var Action = Machine.Action

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

describe('Substates', function() {
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
  describe('substate events', function() {
    it('emits parent.child events on parent', function(done) {
      machine.once('enter Enabled.Heating', function() {
        done()
      })
      console.log('start')
      machine
        .setState('Enabled')
        .getState('Enabled')
      .setState('Heating')
    })

    it('can only trigger events if parent is also "active"', function(done) {
      var transitions = []

      machine.on('enter', function(stateName) {
        transitions.push(stateName)
      })
      var enabledState = machine
        .setState('Disabled')
        .getState('Enabled')
      enabledState.setState('Cooling')

      setTimeout(function() {
        console.log('transitions', transitions)
        transitions.forEach(function(stateName) {
          console.log('stateName', stateName)
          assert(false === !!~stateName.indexOf('Cooling'))
        })
        done()
      }, 0)
    })
  })
})

//var action = new Action({
  //name: 'disable',
  //transitionTo: 'disabled'
//})
//machine.addAction(action, /^enabled\.*/)
//var disabled = new State('disabled')
//var cooling = new State('enabled.cooling')
//var heating = new State('enabled.heating')
//machine.addState(cooling)
//machine.addState(heating)
//machine.addState(disabled)
//machine.setState('enabled.cooling')
//machine.state // => enabled.cooling
//cooling.trigger('disable')
//machine.state // => disabled

//var action = new Action({
  //name: 'disable',
  //transitionTo: 'disabled'
//})


//var disabled = new State('disabled')
//var enabled = new State('enabled')
//enabled.addAction(action)
//var cooling = new State('cooling')
//var heating = new State('heating')
//enabled.addState(cooling)
//enabled.addState(heating)
//machine.addState(enabled)
//machine.addState(disabled)
//machine.setState('enabled.cooling') // has magic
//machine.state // => enabled.cooling // magic
//cooling.trigger('disable') // magic
//machine.state // => disabled
