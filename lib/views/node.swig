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

<p>You can then <kbd>require</kbd> this file into any others you write like so:</p>

<pre>
<code>require('connect')(function(amqp) {
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
queue.bind("exchange-name", "key.#");
queue.bind(exchange_object, "exact.key");

// An event is triggered to confirm completion
// There will be one event per binding
queue.on('queueBindOk', function() {
    // The queue is now bound
})
</code></pre>

<p>Once we have a queue, we set the prefetch size to ensure we're not too
greedy, and then <kbd>subscribe</kbd> to begin receiving messages.<br>
The <kbd>:block</kbd> parameter stops us using multiple threads, which makes
it easier to see the program flow in these examples.<br />
The <kbd>:ack</kbd> option tells the server we will be explicitly acknowledging
messages.</p>

<pre>
channel.prefetch 1
queue.subscribe(:block => true, :ack => true) do | info, metadata, body |
  # do some stuff
  channel.acknowledge(info.delivery_tag)
end
</pre>

<p><a href="http://rubybunny.info/articles/queues.html">More info</a></p>
{% endblock %}


{% block publishing %}
<p>Similar to the queue example, we declare the exchange - of type "topic", and
then we can publish messages to it.</p>

<pre>
# pre-existing exchange
exchange = channel.topic("name", :no_declare => true)

# your own exchange
exchange = channel.topic("name", :durable => false)

# and now publish
exchange.publish("body", :routing_key => "key")
</pre>

<p><a href="http://http://rubybunny.info/articles/exchanges.html">More info</a></p>
{% endblock %}

{% block job-tips %}
<p class="alert alert-danger">TODO: HTML and markdown example code</p>
{% endblock %}
