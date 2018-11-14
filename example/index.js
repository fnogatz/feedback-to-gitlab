var express = require('express')
var feedback = require('../index')

var bodyParser = require('body-parser')

var app = express()
app.use(bodyParser.json())
app.use('/', express.static(__dirname))

app.post('/feedback', function (req, res, next) {
  // get settings from URL
  var originalUrl = req.body.url

  var parts = originalUrl.split('#')[1]
  var options = {}
  parts.split('&').forEach(function (p) {
    var ps = p.split('=')
    options[ps[0]] = ps[1]
  })
  req.body.url = req.body.url.split('#')[0]

  options.url = decodeURI(options.url)

  var handler = feedback({
    url: options.url,
    token: options.token,
    repository: options.repository
  })
  return handler(req, res, next)
})

var port = process.env.PORT || 8080
app.listen(port, function () {
  console.log('Open http://localhost:' + port)
})
