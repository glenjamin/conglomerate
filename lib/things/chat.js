var events = require('events');
var util = require('util');

var async = require('async');

var EXCHANGE_NAME = 'chat';
var EXCHANGE_OPTS = { durable: true, autoDelete: false };
var QUEUE_NAME = 'all-messages';
var QUEUE_OPTS = { durable: true, autoDelete: false, exclusive: true };
var MAX_STORED_MESSAGES = 10;

module.exports = function(setup, callback) {
  var chat = new Chat(setup.log, setup.amqp, setup.app);
  chat.init(callback);
  return chat;
}

util.inherits(Chat, events.EventEmitter);
function Chat(log, amqp, app) {
  this.log = log;
  this.amqp = amqp;
  this.app = app;
  this.queue = null;
  this.messages = [];
}

Chat.prototype.init = function(callback) {
  var chat = this;
  var log = this.log;
  var amqp = this.amqp;
  var app = this.app;

  log.info("Initialising...");

  async.parallel({

    exchange: function(next) {
      log.debug("Delcaring exchange: %s - %j", EXCHANGE_NAME, EXCHANGE_OPTS);
      amqp.exchange(EXCHANGE_NAME, EXCHANGE_OPTS, function(exchange) {
        next(null, exchange);
      });
    },

    queue: function(next) {
      log.debug("Declaring queue: %s - %j", QUEUE_NAME, QUEUE_OPTS);
      amqp.queue(QUEUE_NAME, QUEUE_OPTS, function(queue) {
        next(null, queue);
      });
    },

    express: function(next) {
      log.debug("Setting up routes");
      app.get('/chat', chat.messagesPage.bind(chat));
      next();
    }

  }, function(err, results) {

    if (err) return callback(err);

    this.exchange = results.exchange;
    this.queue = results.queue;

    this.queue.bind(this.exchange, '#');
    this.queue.once('queueBindOk', function() {
      callback();
    });

  }.bind(this));
}

Chat.prototype.run = function() {
  this.log.info("Running");
  this.queue.subscribe(this.onMessage.bind(this));
  this.on('message', this.storeMessages.bind(this));
  this.on('message', this.updateClients);
}

Chat.prototype.onMessage = function(msg, headers, info) {
  var context = {room: info.routingKey};

  var message;
  try {
    message = parseMessage(msg);
    message.room = info.routingKey;
  } catch (ex) {
    this.log.warn(ex, "Invalid message");
    return;
  }

  context.from = message.name;
  this.log.info(context, "Received message");
  this.emit('message', message);
};

Chat.prototype.storeMessages = function(message) {
  this.messages.unshift(message);
  if (this.messages.length > MAX_STORED_MESSAGES) {
    this.messages = this.messages.slice(0, MAX_STORED_MESSAGES);
  }
}

Chat.prototype.updateClients = function(message) {
  var msg = {
    when: message.when.format("h:mm:ss.SSS"),
    room: message.room,
    name: message.name,
    message: message.message
  }
  var io = this.app.get('io').of('/chat');
  io.emit('chat', msg);
}

function parseMessage(msg) {
  var data;
  if (msg.data instanceof Buffer) {
    data = msg.data.toString('utf8');
  } else {
    data = msg;
  }
  if (typeof data === 'string') {
    data = JSON.parse(data);
    if (!data.name || !data.message) {
      throw new Exception('Message needs name and message keys');
    }
  }
  data.when = moment();
  return data;
}

Chat.prototype.messagesPage = function(req, res, next) {
  res.render(
    'chat/messages',
    {
      title: 'Chat Messages',
      messages: this.messages,
      socket: this.app.get('baseUrl') + '/chat',
      max_messages: MAX_STORED_MESSAGES
    }
  );
}