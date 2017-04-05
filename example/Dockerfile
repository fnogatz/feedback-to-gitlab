FROM mhart/alpine-iojs:latest
MAINTAINER Thibault NORMAND <me@zenithar.org>

COPY . /app
WORKDIR /app

RUN npm install --save feedback-to-gitlab express

EXPOSE 3000
CMD ["node", "server.js"]

