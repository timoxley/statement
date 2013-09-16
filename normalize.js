"use strict"

var traverse = require('traverse')
var clone = require('clone')

module.exports = function normalize(states) {
  states = clone(states)
  var result = {}
  traverse(states).forEach(function(x) {
    if (this.isRoot) return
    var self = this
    if (typeof x === 'object') {
      result[self.path.join('.')] = {}
    }
  })

  traverse(states).forEach(function(x) {
    var self = this
    if (this.isRoot) return
    if (typeof x === 'string') {
      result[this.parent.path.join('.')][this.key] = this.parent.path.slice(0, this.parent.path.length -1).concat(x).join('.')
    }
  })

  traverse(traverse(result).clone()).forEach(function(x) {
    var self = this
    if (this.isRoot) return
    if(this.key.split('.').length == 1) return
    var path = this.key.split('.')
    path.pop()
    var currentPath = []
    while(path.length) {
      currentPath.push(path.shift())
      Object.keys(result[currentPath.join('.')]).forEach(function(key) {
        result[self.path][key] = result[currentPath.join('.')][key]
      })
    }
  })
  return result
}
