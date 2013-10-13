# Conglomerate

A server to simulate a fictional company with a bunch of things going on.

## The things

### A job queue of markdown docs to convert to HTML

* Exchange: jobs
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

You are free to publish to this exchange, or create your own queues.

### All the logs from the application

* Exchange: logs
* Routing Keys: <app>.<type>.<level>
* Format: see https://github.com/trentm/node-bunyan


TODO
----

Dashboard view
sublevels
multilevel for remote inspection
clean up old records from level