{% extends 'layout.swig' %}

{% block content %}

<h1>Getting Started</h1>

<ul>
  <li>
    <a href="#setup">Setup</a>
    <ul>
      <li><a href="#requirements">Requirements</a></li>
      <li><a href="#connect">Connecting to AMQP</a></li>
      <li><a href="#subscribing">Subscribing to a queue</a></li>
      <li><a href="#publishing">Publishing to an exchange</a></li>
    </ul>
  </li>
  <li>
    <a href="#exercises">Exercises</a>
    <ul>
      <li><a href="#jobs">Markdown (Job Queue)</a></li>
      <li><a href="#chat">Chat (pub / sub)</a></li>
      <li><a href="#logs">Logs (event stream)</a></li>
      <li><a href="#ball">8 Ball (RPC)</a></li>
    </ul>
  </li>
  <li><a href="#extra">Extra Credit</a></li>
</ul>

<h2 id="setup">Setup</h2>

<h3 id="requirements">Requirements</h3>

{% block requirements %}{% endblock %}

<h3 id="connect">Connecting to AMQP</h3>

{% block connect %}{% endblock %}

<h3 id="subscribing">Subscribing to a queue</h3>

{% block subscribing %}{% endblock %}

<h3 id="publishing">Publishing to an exchange</h3>

{% block publishing %}{% endblock %}

<h2 id="exercises">Exercises</h2>

<p>You can see yours and everyone else's progress on the <a href="dash">Dashboard</a>

<h3 id="jobs">A job queue of markdown docs to convert to HTML</h3>

<ul>
  <li>Queue: documents.ready</li>
  <li>Routing Key: documents.ready</li>
  <li>Format <code>{ "destination": "&lt;url&gt;", "markdown": "&lt;markdown&gt;" }</code></li>
</ul>

<p>The provided markdown should be converted to HTML, and sent back to the url
provided via HTTP POST. An optional HTTP header of <kbd>Author</kbd> can be passed to
say who you are.</p>

<p>The results of recently completed jobs can be seen at <a href="/jobs">/jobs</a>, including the
author of each conversion.</p>

{% block job-tips %}{% endblock %}

<h3 id="chat">A simple chat exchange</h3>

<ul>
  <li>Exchange: chat</li>
  <li>Queue: create your own</li>
  <li>Routing Key: anything (used as “room” name)</li>
  <li>Format <code>{ "name": "&lt;your name&gt;", "message": "&lt;message&gt;" }</code></li>
</ul>

<p>All messages published to this exchange can be viewed on the <a href="/chat">/chat</a> page.</p>

<p>You are free to publish to this exchange, or create your own queues to receive
messages. When creating your own queues, be sure to set exclusive and auto delete.</p>

<h3 id="logs">All the logs from the application</h3>

<ul>
  <li>Exchange: logs</li>
  <li>Routing Keys: &lt;app&gt;.&lt;type&gt;.&lt;level&gt;</li>
  <li>Format: see https://github.com/trentm/node-bunyan</li>
</ul>

<p>Try subscribing by binding on '#' initially, and then you can see what the routing keys look like before experimenting with different combinations of bindings</p>

<h3 id="magic-8-ball-rpc">Magic 8 Ball RPC</h3>

<ul>
  <li>Exchange: 8ball</li>
  <li>Routing Key: 8ball</li>
  <li>Format: the message body is your question</li>
</ul>

<p>As mentioned in the slides, you’ll need to create a temporary queue for replies
<em>before</em> publishing the request. The published message should include the
<kbd>replyTo</kbd> and <kbd>correlationId</kbd> headers.</p>

<h2 id="extra">Extra Credit</h2>

<p>Here are a few suggestions for other things you could implement using the same
data in these scenarios</p>

<ul>
  <li>Try processing multiple jobs at the same time</li>
  <li>Try creating temporary queues on the chat exchange that are only bound to
  a single room</li>
  <li>Try different variations and combinations of bindings for the log exchange</li>
  <li>Experiment with different ways of displaying the information from the log exchange</li>
  <li>Try making multiple 8 ball requests in parallel, and correlating them back together after the replies come back</li>
</ul>

<p>Feel free to experiment with the server, create queues or exchanges, publish
or consume what you want. If you have any other ideas - try them out.</p>

{% endblock %}
