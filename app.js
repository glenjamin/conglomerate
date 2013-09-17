var async = require('async');
var util = require('util');

function getConfigValue(key) {
  key = key.replace('-', '_').toUpperCase();
  var value = process.env[key];
  if (!value) {
    throw new Error(util.format('Expected %s environment variable', key));
  }
  return value;
}

// Create and wire up services
async.auto({

  'amqpLogger': function(next) {
    var logExchange = { name: 'logs', durable: true, autoDelete: false }
    function keyBuilder(log) {
      return [log.name, log.type, log.levelName].join(".");
    }
    next(null, require('./lib/bunyan-amqp')(null, logExchange, keyBuilder));
  },

  'log': ['amqpLogger', function(next, setup) {
    var log = require('bunyan').createLogger({
      name: "conglomerate",
      streams: [
        {level: 'debug', stream: process.stdout},
        {level: 'trace', type: 'raw', stream: setup.amqpLogger}
      ]
    });
    log.child({ type: 'logger' }).info("Initialised logger");
    next(null, log);
  }],

  'express': ['log', function(next, setup) {
    var log = setup.log.child({ type: 'web' });
    require('./lib/web')(log, next);
  }],

  'http': ['express', function(next, setup) {
    var port = getConfigValue('port');
    var app = setup.express;
    var server = require('http').createServer(app);
    server.once('error', listenError);
    server.once('listening', serverStart);
    server.listen(port);
    function listenError(err) {
      server.removeListener('error', listenError);
      next(err);
    }
    function serverStart() {
      var addr = server.address();
      app.get('log').info("serving on http://%s:%s", addr.address, addr.port);
      server.removeListener('error', listenError);
      next(null, server);
    }
  }],

  'amqp': ['amqpLogger', 'log', function(next, setup) {
    var log = setup.log.child({ type: 'amqp' });
    // TODO, wrap up into single function w/ callback
    var amqp = require('amqp');
    var conn = amqp.createConnection({ url: getConfigValue('amqp-url') });
    conn.on('error', function(err) {
      return next(err);
    })
    conn.on('close', function() {
      return next(new Error('Connection closed'));
    })
    conn.on('ready', function() {
      log.info("AMQP connected");
      setup.amqpLogger.setConnection(conn);
      next(null, conn);
    });
  }],

  'level': ['log', function(next, setup) {
    var log = setup.log.child({ type: 'db' });
    var level = require('level');
    var location = getConfigValue('db');
    level(location, {valueEncoding: 'json'}, function(err, db) {
      if (!err) {
        log.info("LevelDB opened for %s", location);
      }
      next(err, db);
    });
  }],

  'conglomerate': ['log', 'express', 'amqp', 'level', function(next, setup) {
    var log = setup.log.child({ type: "manager" });
    var Conglomerate = require('./lib/conglomerate.js').Conglomerate;
    next(null, new Conglomerate(log, setup.express, setup.amqp, setup.level));
  }],

}, function(err, setup) {

  if (err) {
    if (setup.log) {
      setup.log.error(err, "Startup failed");
    } else {
      console.warn("Startup failed" + err);
    }
    process.exit(1);
  }

  setup.conglomerate.run();

})