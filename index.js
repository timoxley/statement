'use strict'

var Emitter = require('emitter')
var Collection = require('collection')
var debug = require('debug')('statemachine')

module.exports = State

Emitter(State.prototype)

State.prototype.defaultState = function defaultState() {
  if (this.state) return this
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
}

State.SEPARATOR = '.'

State.prototype.addState = function addState(state) {
  state.parent = this
  this.states.add(state)
  this.defaultState()
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

  var newStateName = stateNames
  if (!newStateName) throw new Error('Invalid State: ' + newStateName)
  var enteringState = this.getState(newStateName)
  var leavingState = this.state
  if (leavingState === enteringState) return
  leavingState && debug('leaving ' + leavingState.name)
  leavingState && this.emit('leave ' + leavingState.name)
  leavingState && this.emit('leave', leavingState.name)
  this.state = enteringState
  debug('entering ' + enteringState.name)
  enteringState && this.emit('enter ' + enteringState.name)
  enteringState && this.emit('enter', enteringState.name)
  return this
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
