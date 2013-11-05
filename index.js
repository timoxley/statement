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
  this.cancel = this.cancel.bind(this)

  this.on('removeListener', function(event) {
    this.routes = this.routes || []
    this.routes = this.routes.filter(function(route) {
      return route.path !== toRoute(event)
    })
  }.bind(this))
  this.on('newListener', function(event) {
    this.routes = this.routes || []
    this.routes.push(new Route(toRoute(event)))
  }.bind(this))


}

Machine.prototype = Object.create(Emitter.prototype, {constructor: Machine})

/**
 * Add wildcard support to emitter.
 */

Machine.prototype.emit = function(type, event) {
  var self = this
  var args = [].slice.call(arguments)
  this.routes = this.routes || []
  if (type === 'newListener' || type === 'removeListener') {
    // ignore new/remove listener events
    return Emitter.prototype.emit.apply(this, args)
  } 
  // attempt to match route
  this.routes.filter(function(route) {
    return route.match(toRoute(type))
  }).forEach(function(route) {
    var matches = route.match(toRoute(type))
    var routeEventName = fromRoute(route.path)
    Emitter.prototype.emit.apply(self, [routeEventName, matches].concat(args.slice(1)))
  })

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
  if (typeof window !== 'undefined' && window.chrome) {
    // add colour magics
    var firstArg = args[0]
    if (/^trigger/.test(firstArg)) args = ['%c' + args[0], 'color: #CDBE70'].concat(args.slice(1))
    if (/^leave/.test(firstArg)) args = ['%c' + args[0], 'color: 	#EEDC82'].concat(args.slice(1))
    if (/^enter/.test(firstArg)) args = ['%c' + args[0], 'color: #EEC900'].concat(args.slice(1))
  }
  return debug(this.name).apply(null, args)
}

Machine.prototype.debug.enable = function(namespace) {
  debug.enable(namespace || this.name)
  return debug
}

Machine.prototype.add = function add(name, actions, fn) {
  this.states[name] = {
    name: name,
    actions: actions,
    context: this.getContext(name)
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

Machine.prototype.getContext = function getContext(name) {
  this.contexts = this.contexts || Object.create(null)
  return name.split('/').reduce(function(previous, current, index, arr) {
    var path = arr.slice(0, index + 1).join('/')
    if (this.contexts[path]) return this.contexts[path]
    this.contexts[path] = Object.create(previous)
    return this.contexts[path]
  }.bind(this), this)
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

  this.emit.apply(this, [actionName].concat(args))
  this.queue(function() {
    if (this._cancelled) {
      debug('action %s cancelled.', actionName)
      this._cancelled = false
    } else {
      this.go.apply(this, [stateName].concat(args))
    }
  }.bind(this))
}

Machine.prototype.cancel = function cancel() {
  this._cancelled = true
}
