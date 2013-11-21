var async = require('async');

var moment = require('moment');

var GAP = 1000;
var MIN_QUEUE_SIZE = 10;
var EXCHANGE_NAME = 'jobs';
var EXCHANGE_OPTS = { durable: true, confirm: true, autoDelete: false };
var QUEUE_NAME = 'documents.ready';
var QUEUE_OPTS = { durable: true, autoDelete: false, exclusive: false };
var POSTBACK_DELAY = 500;
var MAX_DISPLAYED_JOBS = 20;

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
  this.primus = null;
  this.queue = null;
  this.postbackPath = '/jobs/:jobid';
  this.lastJobid = 0;
}

Jobs.prototype.init = function(callback) {
  var jobs = this;
  var log = this.log;
  var amqp = this.amqp;
  var app = this.app;

  log.info("Initialising...");

  async.parallel({

    markdown: function(next) {
      log.debug("Loading readme as document to be transformed");
      var readme = __dirname + '/../../README.md';
      require('fs').readFile(readme, 'utf8', next);
    },

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
      app.post(jobs.postbackPath, jobs.receivePostback.bind(jobs));
      app.get('/jobs', jobs.completedPage.bind(jobs));
      app.get(jobs.postbackPath, jobs.showPage.bind(jobs));

      next();
    },

    primus: function(next) {
      next(null, app.get('primus').channel('jobs'));
    }

  }, function(err, results) {

    if (err) return callback(err);

    this.markdown = results.markdown;
    this.exchange = results.exchange;
    this.queue = results.queue;
    this.primus = results.primus;

    this.queue.bind(this.exchange, QUEUE_NAME);
    this.queue.once('queueBindOk', function() {
      callback();
    });

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
    queue.close();
    callback(null, args.messageCount);
  });
}

Jobs.prototype.addJob = function(callback) {
  var jobid = (new Date()).toISOString() + '-' + (++this.lastJobid);

  var markdown = this.getMarkdown();

  var jobData = {
    destination: this.getDestination(jobid),
    markdown: markdown,
  };

  this.log.info("Adding job %s to queue", jobid);
  this.exchange.publish(
    QUEUE_NAME,
    JSON.stringify(jobData),
    {
      contentType: "application/json",
      messageId: jobid
    },
    callback()
  );
}

Jobs.prototype.getDestination = function(jobid) {
  var dest = this.app.get('baseUrl') + this.postbackPath;
  return dest.replace(':jobid', jobid);
}

Jobs.prototype.getMarkdown = function() {
  // TODO: mix it up a bit content-wise
  return this.markdown;
}

Jobs.prototype.receivePostback = function(req, res, next) {
  var jobid = req.params.jobid;

  parseBody(req, function(err, body) {
    if (err) return next(err);

    if (!body) {
      this.log.warn("Missing request body for %s", req.url);
      res.header('Content-Type', 'text/plain');
      return res.send(400, 'Bad Data');
    }

    var who = req.get('author') || req.connection.remoteAddress;

    this.log.info("Recording job %s as done in db", jobid);

    var key = buildJobKey(jobid);
    var data = { id: jobid, body: body, who: who, when: new Date() };

    var jobs = this;

    this.db.batch()
      .put(key, data)
      .put('completed-' + jobid, key)
    .write(function(err) {
      if (err) return next(err);

      setTimeout(function() {

        res.header('Content-Type', 'text/plain');
        res.send(200, 'OK');

        jobs.updateClients(data);

      }, POSTBACK_DELAY);

    });

  }.bind(this));
}

var jobKeyRegex = /\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z/;
function buildJobKey(jobid) {
  var m = jobKeyRegex.exec(jobid);
  var date = new Date(m[0]);
  return 'done-' + (new Date('2020-01-01') - date) + '-' + jobid;
}

function parseBody(req, callback) {
  var buffer = '';
  req.setEncoding('utf8');
  req.on('data', function(chunk) { buffer += chunk; });
  req.on('end', function() { callback(null, buffer); });
}

Jobs.prototype.updateClients = function(data) {
  var msg = {
    when: moment(data.when).format("h:mm:ss.SSS"),
    who: data.who,
    id: data.id
  }
  this.log.info('Publishing job to clients');
  this.primus.write(msg);
}

Jobs.prototype.completedPage = function(req, res, next) {
  var app = this.app;

  this.getLatestCompleted(function(err, jobs) {
    if (err) return next(err);

    res.render('jobs/completed', {
      'title': 'Completed Jobs',
      'jobs': jobs,
      'primus': app.get('baseUrl'),
      'channel': 'jobs',
      max_jobs: MAX_DISPLAYED_JOBS
    })
  })
}

Jobs.prototype.showPage = function(req, res, next) {
  this.getCompleted(req.params.jobid, function(err, job) {
    if (err) return next(err);

    res.render('jobs/show', {
      'title': 'Job ' + job.id,
      'job': job
    })
  })
}

Jobs.prototype.getCompleted = function(jobid, callback) {
  var db = this.db;
  db.get('completed-' + jobid, function(err, key) {
    if (err) return callback(err);

    db.get(key, function(err, job) {
      callback(err, job);
    })
  })
}

Jobs.prototype.getLatestCompleted = function(callback) {
  var stream = this.db.createReadStream({
    start: 'done-', end: 'done-\xff',
    limit: MAX_DISPLAYED_JOBS,
  });
  var jobs = [];
  stream.on('data', function(data) {
    var job = data.value;
    job.when = moment(job.when);
    jobs.push(job);
  })
  stream.on('error', function(err) {
    callback(err);
  })
  stream.on('end', function() {
    callback(null, jobs);
  })
}
