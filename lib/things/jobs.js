var async = require('async');

var GAP = 1000;
var MIN_QUEUE_SIZE = 10;
var QUEUE_NAME = 'documents.ready';
var QUEUE_OPTS = { durable: true, autoDelete: false, exclusive: false };

module.exports = function(setup, callback) {
  var jobs = new Jobs(setup.log, setup.level, setup.amqp, setup.app);
  jobs.init(callback);
  return jobs;
}

function Jobs(log, db, amqp, app) {
  this.log = log;
  this.db = db;
  this.amqp = amqp;
  this.app = app;
  this.queue = null;
}

Jobs.prototype.init = function(callback) {
  this.log.info("Initialising...");

  this.log.debug("Declaring queue: %s - %j", QUEUE_NAME, QUEUE_OPTS);
  this.amqp.queue(QUEUE_NAME, QUEUE_OPTS, function(queue) {
    this.queue = queue;
    callback();
  }.bind(this));
}

Jobs.prototype.run = function() {
  this.log.info("Running");
  this.tick();
}

Jobs.prototype.tick = function(callback) {
  var jobs = this;
  jobs.fillQueue(function(err) {
    if (err) {
      jobs.log.warn(err, "Failed to fill queue");
    }
    setTimeout(jobs.tick.bind(jobs), GAP);
  })
}

Jobs.prototype.fillQueue = function(callback) {
  var jobs = this;

  jobs.log.debug("Attempting to fill job queue");

  jobs.getQueueSize(function(err, size) {

    if (err) return callback(err);
    if (size >= MIN_QUEUE_SIZE) {
      jobs.log.debug("Queue already full, doing nothing");
      return callback();
    }

    async.times(
      MIN_QUEUE_SIZE - size,
      function(n, next) { jobs.addJob(next); },
      callback
    );
  })
}

Jobs.prototype.getQueueSize = function(callback) {
  var queue = this.amqp.queue(QUEUE_NAME, {passive: true});
  queue.on('queueDeclareOk', function(args) {
    callback(null, args.messageCount);
  });
}

Jobs.prototype.addJob = function(callback) {
  // TODO: confirm publish?
  this.log.info("Adding job to queue");
  this.amqp.publish(QUEUE_NAME, 'JOB');
  callback();
}