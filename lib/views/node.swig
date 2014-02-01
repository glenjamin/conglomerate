{% extends 'start.swig' %}

{% block requirements %}
<ul>
  <li>A text editor</li>
  <li>A terminal</li>
  <li>Node.js 0.10+</li>
</ul>
<pre>
npm install amqp
</pre>
{% endblock %}


{% block connect %}
<p>Save the following into <kbd>connect.js</kbd></p>

<pre>
<code>var amqp = require('amqp');

module.exports = function(callback) {
    var connection = amqp.createConnection(
        { url: "{{ amqp_url }}" },
        { reconnect: false }
    );

    connection.on('ready', callback.bind(null, connection));
}
</code></pre>

<p>You can then <code>require</code> this file into any others you write like so:</p>

<pre>
<code>require('./connect')(function(amqp) {
    // amqp is now an active connection object
})
</code></pre>


<p><a href="https://github.com/postwait/node-amqp#connection">More info</a></p>
{% endblock %}


{% block subscribing %}
<p>A <code>Queue</code> object can be obtained from a connection, declaring any options</p>

<pre>
<code>// pre-existing queue
amqp.queue("queue-name", {noDeclare: true}, function(q) {
    // q is now a Queue object
});

// Our own named queue
// Use auto-delete so the server cleans up when we finish
amqp.queue("my-queue", {autoDelete: true}, function(q) {
    // q is now a Queue object
});

// Use an empty string to let the server generate a name
// Exclusive queues are also automatically cleaned up
amqp.queue("", {exclusive: true}, function(q) {
    // q is now a Queue object
    // q.name contains the generated queue name
})
</code></pre>

<p>If we have created the queue ourselves, we need to bind the queue to the
exchange to determine which messages we'll receive</p>

<pre>
<code>// we can either use the exchange name, or an Exchange object (see below)
queue.bind("exchange-name", "key.#", callback);
queue.bind(exchangeObject, "exact.key", callback);
</code></pre>

<p>If you do multiple calls to <code>bind</code>, only the last callback will be called, this
is a bit of a quirk in the node-amqp implementation.</p>

<p>Once we have a queue, we can <code>subscribe</code> to begin receiving messages.<br>
The <code>ack</code> option tells the server we will be explicitly acknowleding messages.<br>
the <code>prefetchCount</code> option tells the server how many messages to send
us before waiting until we acknowledge one. It defaults to 1</p>

<pre>
<code>queue.subscribe({ack: true, prefetchCount: 1}, onMessage);
function onMessage(body, headers, deliveryInfo, message) {
  // body is the message content
  // headers includes things like contentType
  // deliveryInfo includes things like routingKey
  // message is an object represnting the above

  // do some stuff
  message.acknowledge();
}
</code></pre>

<p><a href="https://github.com/postwait/node-amqp/#queue">More info</a></p>
{% endblock %}


{% block publishing %}
<p>Similar to the queue example, we declare the exchange - of type "topic", and
then we can publish messages to it.</p>

<pre>
<code>// pre-existing exchange
amqp.exchange("name", {type: "topic", noDeclare: true}, function(x) {
  // x is now an Exchange object
})

// your own exchange
amqp.exchange("name", {type: "topic", durable: false}, function(x) {
  // x is now an Exchange object
})

// and now to publish a message
exchange.publish("key", "body", {contentType: "text/plain"})
</code></pre>

<p><a href="https://github.com/postwait/node-amqp/#exchange">More info</a></p>
{% endblock %}

{% block job-tips %}
<h4>Making HTTP POST Requests</h3>
<p>I recommend using the <a href="http://npm.im/request">request</a> module to
handle this, here's an example:</p>
<pre>
<code>var request = require('request');
request.post(
  {
    url: "http://whatever",
    body: "the body",
    headers: {"Author": "changeme"}
  },
  onResponse
)
function onResponse(err, response, body) {
  // handle response here
}
</code></pre>

<h4>Converting to Markdown</h4>
<p>I recommend using the <a href="http://npm.im/markdown">markdown</a> module to
handle this, here's an example:</p>
<pre>
<code>var markdown = require('markdown');
var html = markdown.toHTML("# Some Markdown");
</code></pre>
{% endblock %}
