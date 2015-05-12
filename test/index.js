require('./initial')
require('./actions')
require('./context')
require('./normalize')

require('tape')('shutdown', function(t) {
  setTimeout(function() {window.close()})
  t.end()
})
