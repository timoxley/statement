"use strict"

var Emitter = require('context-emitter')
var debug = require('debug')

var Machine = module.exports = function Machine(states, initial) {
  debug('Machine')('new machine', states, initial)
  Emitter.call(this)

  var args = arguments

  this.states = {}
  Object.keys(states).forEach(function(name) {
    this.add(name, states[name])
  }, this)

  this.initial = initial || Object.keys(states)[0]

  this.trigger = Machine.prototype.trigger.bind(this)

  process.nextTick(function() {
    if (typeof args[args.length - 1] === 'function') {
      this.once('enter '+this.initial, args[args.length - 1])
    }
    this.go(this.initial)
  }.bind(this))
}

Machine.prototype = Object.create(Emitter.prototype, {constructor: Machine})

Machine.prototype.debug = function() {
  return debug(this.name || 'Machine').apply(null, arguments)
}

Machine.prototype.add = function add(name, actions, fn) {
  this.states[name] = {
    name: name,
    actions: actions,
    context: Object.create(this)
  }
}

Machine.prototype.go = function go(stateName) {
  this.debug('go to state %s', stateName)
  if (!this.states[stateName]) {
    this.debug('missing target state: %s', stateName)
    return
  }

  // only 'leave' if we have a state
  if (this.state) {
    this.emit('before leave', this.state.name, this.state.context)
    this.emit('before leave ' + this.state.name, this.state.context)

    this.debug('leave', this.state.name, this.state)
    this.emit('leave', this.state.name, this.state.context)
    this.emit('leave ' + this.state.name,  this.state.context)

    this.emit('after leave', this.state.name, this.state.context)
    this.emit('after leave ' + this.state.name, this.state.context)
  }

  this.previous = this.state

  this.debug('setting state from %s to %s', this.state && this.state.name, this.states[stateName].name)

  this.state = this.states[stateName]
  this.ctx = this.state.context

  var args = [].slice.call(arguments, 1)

  // trigger events on next tick so handlers can be configured
  process.nextTick(function() {
    this.emit.apply(this, ['before enter', this.state.name, this.state.context].concat(args))
    this.emit.apply(this, ['before enter ' + this.state.name].concat(args))

    this.debug.apply(this, ['enter', this.state.name, this.state].concat(args))

    this.emit.apply(this, ['enter', this.state.name, this.state.context].concat(args))
    this.emit.apply(this, ['enter ' + this.state.name].concat(args))

    this.emit.apply(this, ['after enter', this.state.name, this.state.context].concat(args))
    this.emit.apply(this, ['after enter ' + this.state.name].concat(args))
    this.debug('in state %s', this.state.name)
  }.bind(this))
}

Machine.prototype.trigger = function trigger(actionName) {

  var args = [].slice.call(arguments, 1)

  this.debug('trigger %s in %s', actionName, this.state && this.state.name, args)

  if (!this.state) {
    this.debug('no current state')
    return
  }

  var stateName = this.state.actions[actionName]
  if (!stateName) {
    this.debug('action %s missing target state:', actionName, stateName)
    return
  }

  if (typeof stateName === 'function') {
    this.debug('executing action %s', actionName)
    var fn = stateName
    fn.apply(this.state.context, args)
    return
  }

  if (!this.states[stateName]) {
    this.debug('action %s has invalid target state:', actionName, stateName)
    return
  }

  process.nextTick(function() {
    this.emit.apply(this, [actionName].concat(args))
    this.go.apply(this, [stateName].concat(args))
  }.bind(this))
}
