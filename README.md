# Conglomerate

A server to simulate a fictional company with a bunch of things going on.

## The things

### A job queue of markdown docs to convert to HTML

Exchange: jobs
Queue: documents.ready
Format:
```
{
  "destination": "<url>",
  "markdown": "<markdown>"
}
```

The provided markdown should be converted to HTML, and sent back to the url
provided via HTTP POST.

The results of recently completed jobs can be see at `/jobs`

### All the logs from the application

Exchange: logs
Routing Keys: <app>.<type>.<level>



TODO
----

Dashboard view
sublevels
multilevel for remote inspection
clean up old records from level