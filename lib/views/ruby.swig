{% extends 'start.swig' %}

{% block requirements %}
<ul>
  <li>A text editor</li>
  <li>A terminal</li>
  <li>Ruby 1.9+</li>
</ul>
<pre>
gem install bunny
</pre>
{% endblock %}


{% block connect %}
<p>Save the following into <kbd>connect.rb</kbd></p>

<pre>
require "rubygems"
require "bunny"

@bunny = Bunny.new '<%= amqp_url %>'
@bunny.start
</pre>

<p>You can then <kbd>require</kbd> this file into any others you write.</p>

<p>All communication with the server is done through a channel, you should
use a different channel for each 'thing' you want to do with the server.
to get a new channel use the following:</p>

<pre>
channel = @bunny.channel
</pre>

<p><a href="http://rubybunny.info/articles/connecting.html">More info</a></p>
{% endblock %}


{% block subscribing %}
<p>A queue object can be obtained from a channel, declaring any options</p>

<pre>
# pre-existing queue
queue = channel.queue("queue-name", :no_declare => true)

# Our own queue
queue = channel.queue("my-queue", :auto_delete => true)

# Let the server generate a name
queue = channel.queue("", :exclusive => true)
</pre>

<p>If we have created the queue ourselves, we need to bind the queue to the
exchange to determine which messages we'll receive</p>

<pre>
queue.bind("exchange-name", :routing_key => "key.#")
queue.bind(exchange_object, :routing_key => "exact.key")
</pre>

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
<p class="lead">TODO: HTML and markdown example code</p>
{% endblock %}
