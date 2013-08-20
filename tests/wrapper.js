"use strict"

var assert = require('timoxley-assert')

var Machine = require('state-machine')
var State = Machine.State
var Action = Machine.Action

describe('convenience wrapper', function() {
  it('creates state instances', function() {
    var machine = Machine({
      Active: {}
    })
    assert(machine instanceof State)
    assert.equal(machine.name, 'Active')
  })
  //it('creates actions on states')
})
