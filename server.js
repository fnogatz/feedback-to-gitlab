var fs = require('fs')
var express = require('express')
var bodyParser = require('body-parser')
var cors = require('cors')
var Gitlab = require('gitlab')
var config = require('./config.json')

var gitlab = Gitlab(config);
 
var app = express()

app.use(cors({
  origin: config.origin
}))

// parse application/x-www-form-urlencoded 
app.use(bodyParser.urlencoded({ extended: false, limit: '50mb' }))

// parse application/json 
app.use(bodyParser.json({ limit: '50mb' }))

app.use(function (req, res) {
  var filename = (new Date()).toJSON().replace('.','-').replace(/:/g,'')+'.png'

  var issue = getIssue(req.body, filename)
  issue.labels = config.labels.join(',')

  gitlab.projects.repository.createFile({
    projectId: config.project,
    file_path: 'Screenshots/'+filename,
    branch_name: 'master',
    encoding: 'base64',
    content: req.body.img.replace(/^data:([A-Za-z-+\/]+);base64,/,''),
    commit_message: '(Auto-added user feedback)'
  }, function(data) {
    console.log('Screenshot uploaded')
  })

  gitlab.issues.create(config.project, issue, function() {
    console.log('Issue created')
  })

  res.json({
    result: 'OK'
  })
})

app.listen(config.port)

function getIssue(body, filename) {
  var now = new Date()

  return {
    title: body.note.slice(0,20),
    description: [
      '## Description',
      '',
      body.note,
      '',
      '## Browser Information',
      '',
      '- Platform: '+body.browser.platform,
      '- User Agent: '+body.browser.userAgent,
      '- Cookies enabled: '+(body.browser.cookieEnabled ? 'yes' : 'no'),
      '- Plugins: '+body.browser.plugins.join(', '),
      '',
      '## Additional Information',
      '',
      '- URL: '+body.url,
      '- Reported by: '+body.contact,
      '- Reported at: '+now.toLocaleTimeString()+' '+now.toLocaleDateString(),
      '',
      '## Screenshot',
      '',
      '![Screenshot](https://gitlab.dev.chess.io/niggemann/Issues/raw/master/Screenshots/'+filename+')'
    ].join('\n')
  }
}
