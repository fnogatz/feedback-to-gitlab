# feedback-to-gitlab in Docker

To build image :
> docker build -ti <user>/feedback .

To run feedback server :
> docker run -ti -e GITLAB_URL=<url> -e GITLAB_TOKEN=<token> -e GITLAB_REPOSITORY=<repo> <user>/feedback


You reverse to it using an “/feedback” mapping with haproxy or nginx depending on your system.
