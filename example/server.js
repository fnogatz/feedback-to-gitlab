const express = require('express')
const feedback = require('../index')

const bodyParser = require('body-parser')

const app = express()
app.use(bodyParser.json())
app.use('/', express.static(__dirname))

app.post('/feedback', function (req, res, next) {
  // get settings from URL
  const originalUrl = req.body.url

  const parts = originalUrl.split('#')[1]
  const options = {}
  parts.split('&').forEach(function (p) {
    const ps = p.split('=')
    options[ps[0]] = ps[1]
  })
  req.body.url = req.body.url.split('#')[0]

  options.url = decodeURI(options.url)

  const handler = feedback({
    url: options.url,
    token: options.token,
    repository: options.repository
  })
  return handler(req, res, next)
})

const port = process.env.PORT || 8080
app.listen(port, function () {
  console.log('Open http://localhost:' + port)
})
