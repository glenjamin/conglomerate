var util = require('util');
var events = require('events');

var bunyan = require('bunyan');
var levelToName = {};
levelToName[bunyan.TRACE] = 'trace';
levelToName[bunyan.DEBUG] = 'debug';
levelToName[bunyan.INFO] = 'info';
levelToName[bunyan.WARN] = 'notice';
levelToName[bunyan.ERROR] = 'error';
levelToName[bunyan.FATAL] = 'fatal';

function defaultKeyBuilder(record) {
  return [record.name, record.levelName].join(",");
}

module.exports = function(amqp, exchangeOptions, keyBuilder) {
  keyBuilder = keyBuilder || defaultKeyBuilder;
  return new AMQPLogger(amqp, exchangeOptions, keyBuilder);
}

util.inherits(AMQPLogger, events.EventEmitter);
function AMQPLogger(amqp, exchangeOptions, keyBuilder) {
  this.amqp = amqp;
  this.exchangeOptions = exchangeOptions;
  this.keyBuilder = keyBuilder;
  this.writable = true;
  this.buffer = [];
  this.initExchange();
  events.EventEmitter.call(this);
}

AMQPLogger.prototype.setConnection = function(amqp) {
  this.amqp = amqp;
  this.initExchange();
};

AMQPLogger.prototype.initExchange = function() {
  if (this.amqp) {
    var opts = this.exchangeOptions;
    var logger = this;
    this.amqp.exchange(opts.name, opts, function(exchange) {
      logger.exchange = exchange;
      logger.flushBuffer();
    });
  }
};

AMQPLogger.prototype.flushBuffer = function() {
  if (this.buffer.length) {
    this.buffer.forEach(function(record) { this.write(record); }.bind(this));
    this.buffer = [];
  }
};

AMQPLogger.prototype.write = function(record) {
  if (!this.exchange) {
    this.buffer.push(record);
  } else {
    record.levelName = levelToName[record.level];
    this.exchange.publish(this.keyBuilder(record), record);
  }
};

