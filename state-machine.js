'use strict'

var Emitter = require('emitter')
var Collection = require('collection')
var debug = require('debug')('statemachine')

module.exports = State

Emitter(State.prototype)

State.prototype.defaultState = function defaultState(state) {
  this._defaultState = this.getState(state)
  if (this.state) return this
  if (this._defaultState) return this.setState(this._defaultState)
  var firstState = this.getState(this.states.at(0))
  firstState && this.setState(firstState)
  return this
}

State.prototype.getState = function getState(stateName) {
  if (stateName) return this.states.get(stateName)
  return this.state
}

State.prototype.trigger = function trigger(actionName) {
  var currentState = this.getState()
  if (!currentState) throw new Error('Cannot trigger action '+actionName+' if there is no state!')
  debug('triggering ' + actionName + ' from ' + currentState.name)
  var currentAction = currentState.getAction(actionName)
  if (!currentAction) return this
  debug('success.')
  this.setState(currentAction.target)
  return this
}

function State(options) {
  options = options || {}
  this.name = options.name
  this.parent = options.parent
  this.states = options.states || new Collection().key('name')
  this.actions = options.actions || new Collection().key('name')
  this.enabled = false
}

State.SEPARATOR = '.'

State.prototype.addState = function addState(state) {
  var self = state.parent = this
  state.on('enter', function(enteringState) {
    if (self.state !== state) return
    var currentName  = self.state.name ? self.state.name + State.SEPARATOR : ''
    var aggregateStateName = currentName + enteringState
    debug(self.name + ' enter aggregate ' + aggregateStateName)
    self.emit('enter ' + aggregateStateName)
    self.emit('enter', aggregateStateName)
  })
  this.states.add(state)
  if (this.states.items.length === 1) {
    this.defaultState(this.states.items[0])
  }
  return this
}

State.prototype.removeState = function removeState(stateName) {
  this.states.remove(state)
  return this
}

State.prototype.hasState = function hasState(state) {
  return this.states.has(state)
}

State.prototype.addAction = function addAction(action) {
  this.actions.add(action)
  return this
}

State.prototype.getAction = function hasAction(action) {
  return this.actions.get(action)
}

State.prototype.hasAction = function hasAction(action) {
  return this.actions.has(action)
}

State.prototype.getPath = function getPath() {
  if (!this.parent) return '';
  return this.parent.getPath(this.parent) + State.SEPARATOR + target.name
}

function Action(options) {
  this.name = options.name
  this.target = options.target
}

module.exports.State = State
module.exports.Action = Action

State.prototype.setState = function setState(stateNames) {
  if (typeof stateNames === 'string' && !!~stateNames.indexOf(State.SEPARATOR)) {
    debug('try set nested state to ' + stateNames)
    this._setNestedState(stateNames.split(State.SEPARATOR))
    return this
  }
  if (typeof stateNames === 'object' && stateNames.name) stateNames = stateNames.name
  var enteringState = stateNames
  var leavingState = this.state && this.state.name
  this._transition(leavingState, enteringState)


  return this
}
State.prototype._transition = function(leavingState, enteringState) {
  if (leavingState === enteringState) return
  var state = this.getState(enteringState)
  if (!enteringState || !state) throw new Error('Invalid State: ' + enteringState)
  this.state = state
  this._leaveState(leavingState)
  this.emit('transition', leavingState, enteringState)
  this._enterState(enteringState)
}

State.prototype._leaveState = function(leavingState) {
  //var leavingState = this.state || {name: null}
  debug(this.name + ' leaving ' + leavingState)
  this.emit('leave ' + leavingState)
  this.emit('leave', leavingState)
}

State.prototype._enterState = function(enteringState) {
  debug(this.name + ' entering ' + enteringState)
  this.emit('enter ' + enteringState)
  this.emit('enter', enteringState)
}

State.prototype._setNestedState = function(states) {
  var childName = states.shift()
  if (!childName) return this
  this.setState(childName)
  var child = this.getState(childName)
  return child._setNestedState(states)
}

State.prototype.getHeirarchy = function getHeirarchy(states) {
  if (!states || !states.length) return this.getHeirarchy([this.getState()])
  var currentState = states[states.length - 1]
  var childState = currentState.getState()
  if (childState) return this.getHeirarchy(states.concat(childState))
  return states
}

