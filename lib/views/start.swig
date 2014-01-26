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

<hr />
<h3 id="jobs">A job queue of markdown docs to convert to HTML</h3>

<ul>
  <li>Queue: documents.ready</li>
  <li>Format <code>{ "destination": "&lt;url&gt;", "markdown": "&lt;markdown&gt;" }</code></li>
</ul>

<p>The provided markdown should be converted to HTML, and sent back to the url
provided via HTTP POST. An optional HTTP header of <kbd>Author</kbd> can be passed to
say who you are.</p>

<p>The results of recently completed jobs can be seen at <a href="/jobs">/jobs</a>, including the
author of each conversion.</p>

{% block job-tips %}{% endblock %}

<hr />
<h3 id="chat">A simple chat exchange</h3>

<ul>
  <li>Exchange: chat</li>
  <li>Queue: create your own</li>
  <li>Routing Key: anything (used as “room” name)</li>
  <li>Format <code>{ "name": "&lt;your name&gt;", "message": "&lt;message&gt;" }</code></li>
</ul>

<p>All messages published to this exchange can be viewed on the <a href="/chat">/chat</a> page.</p>

<p>Publish messages to the exchange, you'll see them appear on the dashboard</p>

<p>Now try making your own queue and binding to the exchange to receive messages,
be sure to set exclusive and auto delete.</p>

<hr />
<h3 id="logs">All the logs from the application</h3>

<ul>
  <li>Exchange: logs</li>
  <li>Routing Keys: &lt;app&gt;.&lt;type&gt;.&lt;level&gt;</li>
  <li>Format: see https://github.com/trentm/node-bunyan</li>
</ul>

<p>Try subscribing by binding on <code>#</code> initially, and then you can see
what the routing keys look like before experimenting with different combinations of bindings</p>

<hr />
<h3 id="magic-8-ball-rpc">Magic 8 Ball RPC</h3>

<ul>
  <li>Exchange: 8ball</li>
  <li>Routing Key: 8ball</li>
  <li>Format: the message body is your question</li>
</ul>

<ol>
  <li>Create a "reply" queue</li>
  <li>Subscribe to the reply queue</li>
  <li>Publish a message to the exchange where <code>replyTo: queue.name</code></li>
  <li>Once completed, a message will be sent to the named queue</li>
</ol>

<p>Try sending more than one message at once, giving each one a different
<code>correlationId</code> - this will be included in the reply messages, so you
can match it up to your request.</p>

<hr />
<h2 id="extra">Extra Credit</h2>

<p>Here are a few suggestions for other things you could implement using the same
data in these scenarios</p>

<ul>
  <li>Try processing multiple jobs at the same time</li>
  <li>Try formatting the messages from the chat exchange like a chat room</li>
  <li>Try different variations and combinations of bindings for the log exchange</li>
  <li>Experiment with different ways of displaying the information from the log exchange</li>
</ul>

<p>Feel free to experiment with the server, create queues or exchanges, publish
or consume what you want. If you have any other ideas - try them out.</p>

{% endblock %}
