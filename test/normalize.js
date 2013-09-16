"use strict"

var test = require('tape')
var normalize = require('../normalize')

var normalized = normalize({
  Disabled: {
    enable: 'Enabled'
  },
  Enabled: {
    disable: 'Disabled',
    Low: {
      faster: 'High'
    },
    High: {
      slower: 'Low'
    }
  }
})
var expected = {
  Enabled: {
    disable: 'Disabled'
  },
  'Enabled.Low': {
    faster: 'Enabled.High',
    disable: 'Disabled'
  },
  'Enabled.High': {
    slower: 'Enabled.Low',
    disable: 'Disabled'
  },
  Disabled: {
    enable: 'Enabled'
  }
}

test('normalization', function(t) {
  t.plan(1)
  t.deepEqual(normalized, expected)
})

