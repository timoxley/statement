"use strict"

var Emitter = require('context-emitter')
var debug = require('debug')('Machine')

var Machine = module.exports = function Machine(states, initial) {
  debug('new machine', states, initial)
  var args = arguments
  this.states = Object.keys(states).reduce(function(obj, stateName) {
    var state = states[stateName]
    obj[stateName] = {
      name: stateName,
      actions: states[stateName],
      context: Object.create(this)
    }
    return obj
  }.bind(this), {})

  this.initial = initial || Object.keys(states)[0]
  Emitter.call(this)
  process.nextTick(function() {
    if (typeof args[args.length - 1] === 'function') {
      this.once('enter '+this.initial, args[args.length - 1])
    }
    this.go(this.initial)
  }.bind(this))
  this.trigger = Machine.prototype.trigger.bind(this)
}

Machine.prototype = Object.create(Emitter.prototype, {constructor: Machine})

Machine.prototype.go = function go(stateName) {
  debug('go to state %s', stateName)
  if (!this.states[stateName]) {
    debug('missing target state: %s', stateName)
    return
  }

  if (this.state) {
    debug('leave', this.state.name, this.state)
    this.emit('leave', this.state.name)
    this.emit('leave ' + this.state.name)
  }
  debug('setting state from %s to %s', this.state && this.state.name, this.states[stateName].name)
  this.state = this.states[stateName]
  this.ctx = this.state.context
  var args = [].slice.call(arguments, 1)
  process.nextTick(function() {
    debug.apply(null, ['enter', this.state.name, this.state].concat(args))
    this.emit.apply(this, ['enter', this.state].concat(args))
    this.emit.apply(this, ['enter ' + this.state.name].concat(args))
    debug('in state %s', this.state.name)
  }.bind(this))
}

Machine.prototype.trigger = function trigger(actionName) {
  debug('trigger %s in %s', actionName, this.state.name)
  if (!this.state) return
  var stateName = this.state.actions[actionName]
  if (!stateName) {
    debug('action %s missing target state:', actionName, stateName)
    return
  }

  if (!this.states[stateName]) {
    debug('action %s has invalid target state:', actionName, stateName)
    return
  }
  var args = [].slice.call(arguments, 1)
  process.nextTick(function() {
    this.emit.apply(this, [actionName].concat(args))
    this.go.apply(this, [stateName].concat(args))
  }.bind(this))
}
