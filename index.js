module.exports = feedback

var Gitlab = require('gitlab/dist/es5').default
var bodyParser = require('body-parser')

var requiredOptions = [ 'url', 'token', 'repository' ]

function feedback (options) {
  options = options || {}
  options.auth = options.auth || null
  options.labels = options.labels || [ 'new' ]
  options.store = options.store || {}
  options.store.repository = options.store.repository || options.repository
  options.store.branch = options.store.branch || 'master'
  options.store.path = options.store.path || 'screenshots'
  options.store.limit = options.store.limit || '1mb'

  requiredOptions.forEach(function checkForRequired (required) {
    if (!options[required]) {
      throw new Error('Setting in feedback configuration missing: ' + required)
    }
  })

  var gitlabConfig = {
    url: options.url,
    token: options.token
  }
  if (options.auth) {
    gitlabConfig.auth = [ options.auth.user, options.auth.password ]
  }
  var gitlab = new Gitlab(gitlabConfig)

  function handler (req, res, next) {
    // parse JSON body
    bodyParser.json({ limit: options.store.limit }).call(this, req, res, function () {})

    var filename = (new Date()).toJSON().replace('.', '-').replace(/:/g, '') + '.png'
    var filepath = ''
    if (options.store.path !== '') {
      filepath = options.store.path.replace(/^\//, '').replace(/\/$/, '') + '/'
    }
    filepath += filename
    var content = req.body.img.replace(/^data:([A-Za-z-+\/]+);base64,/, '')

    var screenshotUrl = options.url + '/' + options.store.repository.slug + '/raw/' + options.store.branch + '/' + filepath
    var issue = generateIssue(req.body, screenshotUrl, options)

    res.json({
      result: 'OK'
    })

    gitlab.Issues.create(options.repository.id, issue).then(function (data) {
      var issueId = data.iid

      gitlab.RepositoryFiles.create(options.store.repository.id, filepath, options.store.branch, {
        encoding: 'base64',
        content: content,
        commit_message: 'Screenshot for Issue #' + issueId
      }).then(function (data) {
        console.log('Issue #' + issueId + ' created')
      })
    })
  }

  return function (req, res, next) {
    bodyParser.json({ limit: options.store.limit }).call(this, req, res, function (err) {
      if (err) {
        next(err)
        return
      }

      var self = this

      getRepositoryObject(options.repository, gitlab, function (obj) {
        options.repository = obj

        getRepositoryObject(options.store.repository, gitlab, function (obj) {
          options.store.repository = obj

          handler.call(self, req, res, next)
        })
      })
    })
  }
}

function getRepositoryObject (identifier, gitlab, callback) {
  gitlab.Projects.all().then(function (repos) {
    var i
    if (typeof identifier === 'string') {
      for (i = 0; i < repos.length; i++) {
        if (repos[i].path_with_namespace === identifier.replace(/ /g, '')) {
          callback({
            id: repos[i].id,
            slug: repos[i].path_with_namespace
          })
          return
        }
      }
    } else if (typeof identifier === 'number') {
      for (i = 0; i < repos.length; i++) {
        if (repos[i].id === identifier) {
          callback({
            id: repos[i].id,
            slug: repos[i].path_with_namespace
          })
          return
        }
      }
    }

    throw new Error('Repository not found: ' + identifier)
  })
}

/**
 * Generate the entity object for issue creation.
 * @param  {Object} body     parsed request body
 * @param  {String} url      screenshot URL
 * @param  {Object} options
 * @return {Object}          object that can be used by gitlab.issue.create()
 */
function generateIssue (body, url, options) {
  var now = new Date()

  var description = [
    body.note,
    '',
    '## Browser Information',
    '',
    '- Platform: ' + body.browser.platform,
    '- User Agent: ' + body.browser.userAgent,
    '- Cookies enabled: ' + (body.browser.cookieEnabled ? 'yes' : 'no'),
    '- Plugins: ' + body.browser.plugins.join(', '),
    '',
    '## Additional Information',
    '',
    '- URL: ' + body.url
  ]
  if (body.contact) {
    description.push('- Reported by: ' + body.contact)
  }
  description = description.concat([
    '- Reported at: ' + now.toLocaleTimeString() + ' ' + now.toLocaleDateString(),
    '',
    '## Screenshot',
    '',
    '![Screenshot](' + url + ')'
  ])

  var issue = {
    title: body.note.slice(0, 30),
    description: description.join('\n'),
    labels: options.labels.join(',')
  }

  return issue
}
