var express = require('express'),
    feedback = require('feedback-to-gitlab');

var app = express();

app.post('/feedback', feedback({
    url: process.env.GITLAB_URL,
    token: process.env.GITLAB_TOKEN,
    repository: process.env.GITLAB_REPOSITORY
}))

app.listen(3000);
