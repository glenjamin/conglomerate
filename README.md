# Conglomerate

A server to simulate a fictional company with a bunch of things going on.

## The things

### A job queue of markdown docs to convert to HTML

* Queue: documents.ready
* Routing Key: documents.ready
* Format `{ "destination": "<url>", "markdown": "<markdown>" }`

The provided markdown should be converted to HTML, and sent back to the url
provided via HTTP POST. An optional HTTP header of 'Author' can be passed to
say who you are.

The results of recently completed jobs can be seen at `/jobs`, including the
author of each conversion.

### A simple chat exchange

* Exchange: chat
* Queue: create your own
* Routing Key: anything (used as "room" name)
* Format `{ "name": "<your name>", "message": "<message>" }`

All messages published to this exchange can be viewed on the `/chat` page.

You are free to publish to this exchange, or create your own queues to receive
messages.

### All the logs from the application

* Exchange: logs
* Routing Keys: <app>.<type>.<level>
* Format: see https://github.com/trentm/node-bunyan

### Magic 8 Ball RPC

* Exchange: 8ball
* Routing Key: 8ball
* Format: the message body is your question

As mentioned in the slides, you'll need to create a temporary queue for replies
*before* publishing the request. The published message should include the
replyTo and correlationId headers.

TODO
----

sublevels
multilevel for remote inspection
clean up old records from level

## Development

The following environment variables are required:

* `PORT` - http interface port
* `AMQP_URL` - URL of main amqp vhost
* `DB` - path to leveldb location
* `HOSTNAME` - hostname to expose to clients in queue messages
* `PUBLIC_AMQP` - URL of amqp vhost to tell clients about

Bunyan log output will be written to stdout, so you probably want to pipe it.

For example:

    PORT=1987 AMQP_URL=amqp://guest:guest@localhost:5672/conglomerate DB=./db HOSTNAME=localhost PUBLIC_AMQP=amqp://guest:guest@localhost:5672/conglomerate node app.js | ./node_modules/.bin/bunyan -l info