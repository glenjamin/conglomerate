var async = require('async');
var util = require('util');
var url = require('url');

//var agent = require('webkit-devtools-agent');

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

    var bunyanAmqp = require('./lib/bunyan-amqp');

    var logExchange = { name: 'logs', durable: true, autoDelete: false }
    function keyBuilder(log) {
      return [log.name, log.type, bunyanAmqp.levelToName[log.level]].join(".");
    }
    next(null, bunyanAmqp(null, logExchange, keyBuilder));
  },

  'log': ['amqpLogger', function(next, setup) {
    bunyan = require('bunyan');
    var log = bunyan.createLogger({
      name: "conglomerate",
      streams: [
        {level: 'debug', stream: process.stdout},
        /*{level: 'trace', type: 'raw', stream: setup.amqpLogger}*/
      ],
      serializers : bunyan.stdSerializers
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
      app.set('baseUrl', url.format({
        protocol: 'http',
        hostname: getConfigValue('hostname'),
        port: addr.port
      }))
      app.get('log').info("serving on %s", app.get('baseUrl'));
      server.removeListener('error', listenError);
      next(null, server);
    }
  }],

  /*'amqp': ['amqpLogger', 'log', function(next, setup) {
    var log = setup.log.child({ type: 'amqp' });
    // TODO, wrap up into single function w/ callback
    var amqp = require('amqp');
    var url = getConfigValue('amqp-url');
    log.debug("Connecting to %s", url);
    var conn = amqp.createConnection({ url: url });
    conn.on('error', connectionFailed)
    conn.on('ready', function() {
      log.info("AMQP connected");
      conn.removeListener('error', connectionFailed);
      setup.amqpLogger.setConnection(conn);
      next(null, conn);
    });
    function connectionFailed(err) {
      log.warn(err, "Failed to connect to %s", url);
      return next(err);
    }
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

  'things': ['conglomerate', function(next, setup) {
    var con = setup.conglomerate;
    var things = ['jobs'];
    async.forEach(things, con.addThing.bind(con), next);
  }]*/

}, function(err, setup) {

  if (err) {
    if (setup.log) {
      setup.log.error(err, "Startup failed");
    }
    console.warn("Startup failed", err);
    process.exit(1);
  }

  /*setup.conglomerate.run();

  setup.amqp.on('error', function(err) {
    setup.log.error(err, "AMQP connection error");
    setup.log.warn("Shutting down");
    setTimeout(process.exit.bind(process, 1), 100);
  })*/

})