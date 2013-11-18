var async = require('async');

var EXCHANGE_NAME = '8ball';
var EXCHANGE_OPTS = { durable: true, autoDelete: false };
var QUEUE_NAME = 'incoming';
var QUEUE_OPTS = { durable: true, autoDelete: false, exclusive: false};

module.exports = function(setup, callback) {
  var eb = new EightBall(setup.log, setup.amqp, setup.app);
  eb.init(callback);
  return eb;
}

function EightBall(log, amqp, app) {
  this.log = log;
  this.amqp = amqp;
  this.app = app;
  this.exchange = null;
  this.queue = null;
}

EightBall.prototype.init = function(callback) {
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

    /*express: function(next) {
      log.debug("Setting up routes");
      app.get('/chat', chat.messagesPage.bind(chat));
      next();
    }*/

  }, function(err, results) {

    if (err) return callback(err);

    this.exchange = results.exchange;
    this.queue = results.queue;

    this.queue.bind(this.exchange, '8ball');
    this.queue.once('queueBindOk', function() {
      callback();
    });

  }.bind(this));
}

EightBall.prototype.run = function() {
  this.log.info("Running");
  this.queue.subscribe(this.onMessage.bind(this));
}

EightBall.prototype.onMessage = function(msg, meta, info) {
  var ctx = {
    replyTo: info.replyTo,
    correlationId: info.correlationId
  };

  if (!ctx.replyTo || !ctx.correlationId) {
    this.log.warn(ctx, "Invalid request");
    return;
  }
  this.log.info(ctx, "Got request");

  var answer = this.getAnswer(parseMessage(msg));
  var amqp = this.amqp, log = this.log;
  setTimeout(function() {
    log.info(answer, "Answering request");
    amqp.publish(
      ctx.replyTo, JSON.stringify(answer),
      {correlationId: ctx.correlationId, contentType: 'application/json'}
    );
  }, this.getDelay());

};

function parseMessage(msg) {
  var data;
  if (msg.data instanceof Buffer) {
    data = msg.data.toString('utf8');
  } else {
    data = msg;
  }
  return data;
}

EightBall.prototype.getDelay = function() {
  return (Math.random() * 400) + 100;
}

var answers = [
  "Yes",
  "Most definitely",
  "AMQP is always the answer",
  "Never",
  "Well, maybe this once",
  "You disgust me.",
  "Try again later, I've got a big queue to process",
  "Nope",
  "Hahahahahahahah",
];

EightBall.prototype.getAnswer = function(question) {
  var index = Math.floor(answers.length * Math.random());
  return {
    "question": question,
    "answer": answers[index]
  };
}
