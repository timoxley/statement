"use strict"

var Emitter = require('context-emitter')
var debug = require('debug')
var Route = require('route-component')

var Machine = module.exports = function Machine(states, initial) {
  debug('Machine')('new machine', states, initial)
  if (this.constructor === Machine) Emitter.call(this, this)

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

  this.name = "Machine " + parseInt(String(Math.random()).slice(2), 10).toString(16)

  var enable = this.debug.enable
  this.debug = this.debug.bind(this)
  this.debug.enable = enable.bind(this)

}

Machine.prototype = Object.create(Emitter.prototype, {constructor: Machine})

/**
 * Add wildcard support to emitter.
 */

Machine.prototype.emit = function(type, event) {
  var self = this
  var args = [].slice.call(arguments)
  this.routes = this.routes || []
  if (type === 'newListener') {
    this.routes.push(new Route(toRoute(event)))
    return Emitter.prototype.emit.apply(this, args)
  } else if (type === 'removeListener') {
    this.routes = this.routes.filter(function(route) {
      return route.path !== toRoute(event)
    })
    return Emitter.prototype.emit.apply(this, args)
  } else {
    this.routes.filter(function(route) {
      return route.match(toRoute(type))
    }).forEach(function(route) {
      var matches = route.match(toRoute(type))
      var routeEventName = fromRoute(route.path)
      Emitter.prototype.emit.apply(self, [routeEventName, matches].concat(args.slice(1)))
    })
  }

}

function toRoute(str) { return str.replace(' ', '/', 'g') }
function fromRoute(str) { return str.replace('/', ' ', 'g') }


Machine.prototype.queue = function(fn) {
  this._queue = this._queue || []
  this._queue.push(fn)
  this.dequeue()
}

Machine.prototype.dequeue = function() {
  var fn = this._queue.shift()
  if (!fn) return
  process.nextTick(function() {
    fn()
    this.dequeue()
  }.bind(this))
}


Machine.prototype.debug = function() {
  var args = [].slice.call(arguments)
  if (window.chrome) {
    // add colour magics
    var firstArg = args[0]
    if (/^trigger/.test(firstArg)) args = ['%c' + args[0], 'color: #CDBE70'].concat(args.slice(1))
    if (/^leave/.test(firstArg)) args = ['%c' + args[0], 'color: 	#EEDC82'].concat(args.slice(1))
    if (/^enter/.test(firstArg)) args = ['%c' + args[0], 'color: #EEC900'].concat(args.slice(1))
  }
  return debug(this.name).apply(null, args)
}

Machine.prototype.debug.enable = function(namespace) {
  return debug.enable(namespace || this.name)
}

Machine.prototype.add = function add(name, actions, fn) {
  this.states[name] = {
    name: name,
    actions: actions,
    context: Object.create(this)
  }
}

Machine.prototype.go = function go(stateName) {
  if (!this.states[stateName]) {
    this.debug('missing target state: %s', stateName)
    return
  }

  // only 'leave' if we have a state
  if (this.state) {
    this.queue(function() {
      this.emit('before leave', this.state.name, this.state.context)
      this.emit('before leave ' + this.state.name, this.state.context)

      this.debug('leave %s', this.state.name, this.state)
      this.emit('leave', this.state.name, this.state.context)
      this.emit('leave ' + this.state.name,  this.state.context)

      this.emit('after leave', this.state.name, this.state.context)
      this.emit('after leave ' + this.state.name, this.state.context)
    }.bind(this))
  }

  var args = [].slice.call(arguments, 1)

  // trigger events on next tick so handlers can be configured
  this.queue(function() {

    this.previous = this.state

    this.state = this.states[stateName]
    this.ctx = this.state.context

    this.emit.apply(this, ['before enter', this.state.name, this.state.context].concat(args))
    this.emit.apply(this, ['before enter ' + this.state.name].concat(args))

    this.debug.apply(this, ['enter %s', this.state.name, this.state].concat(args))

    this.emit.apply(this, ['enter', this.state.name, this.state.context].concat(args))
    this.emit.apply(this, ['enter ' + this.state.name].concat(args))

    this.emit.apply(this, ['after enter', this.state.name, this.state.context].concat(args))
    this.emit.apply(this, ['after enter ' + this.state.name].concat(args))
  }.bind(this))
}

Machine.prototype.trigger = function trigger(actionName) {

  var args = [].slice.call(arguments, 1)

  this.debug('trigger %s in %s', actionName, this.state && this.state.name, args)

  if (!this.state) {
    this.debug('no current state. action %s queued.', actionName)
    this.once('enter', function() {
      this.trigger.apply(this, [actionName].concat(args))
    }.bind(this))
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
