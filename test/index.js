require('./initial')
require('./actions')
require('./context')
require('./normalize')

if (process.browser) {
  require('tape')('shutdown', function(t) {
    setTimeout(function() {window.close()})
    t.end()
  })
}
