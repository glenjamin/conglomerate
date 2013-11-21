var async = require('async');
var util = require('util');
var url = require('url');

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
        {level: 'trace', type: 'raw', stream: setup.amqpLogger}
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
    server.once('error', next);
    server.once('listening', serverStart);
    server.listen(port);
    function serverStart() {
      var addr = server.address();
      app.set('baseUrl', url.format({
        protocol: 'http',
        hostname: getConfigValue('hostname'),
        port: addr.port
      }))
      app.get('log').info("serving on %s", app.get('baseUrl'));
      server.removeListener('error', next);
      next(null, server);
    }
  }],

  'primus': ['http', function(next, setup) {
    var app = setup.express;
    var Primus = require('primus');
    var primus = new Primus(setup.http, {
      parser: 'json', transformer: 'websockets'
    });
    primus.use('multiplex', require('primus-multiplex'));
    app.set('primus', primus);
    app.get('log').info("primus initialised");
    next(null, primus);
  }],

  'amqp': ['amqpLogger', 'log', function(next, setup) {
    var log = setup.log.child({ type: 'amqp' });
    // TODO, wrap up into single function w/ callback
    var amqp = require('amqp');
    var url = getConfigValue('amqp-url');
    log.debug("Connecting to %s", url);
    var conn = amqp.createConnection({ url: url, reconnect: false });
    conn.on('error', connectionFailed)
    conn.on('ready', function() {
      log.info("AMQP connected");
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
    var things = ['jobs', 'chat', '8ball'];
    async.forEach(things, con.addThing.bind(con), next);
  }]

}, function(err, setup) {

  if (err) {
    if (setup.log) {
      setup.log.error(err, "Startup failed");
    }
    console.warn("Startup failed", err);
    process.exit(1);
  }

  setup.express.get('/dash', function(req, res) {
    res.render('dashboard', {title: 'Dashboard'});
  })

  var public_amqp = getConfigValue('public-amqp');
  setup.express.get('/', function(req, res) {
    res.render('start', {
      title: 'Start',
      amqp_url: public_amqp
    });
  })

  setup.conglomerate.run();

  setup.amqp.on('error', function(err) {
    setup.log.error(err, "AMQP connection error");
    setup.log.warn("Shutting down");
    setTimeout(process.exit.bind(process, 1), 100);
  })

})
