var util = require('util');

var express = require('express');

module.exports = function(log, callback) {
  var app = express();

  app.set('log', log);

  function ip(req) {
    if (req.ip) return req.ip;
    var sock = req.socket;
    if (sock.socket) return sock.socket.remoteAddress;
    return sock.remoteAddress;
  }
  function logfmt(req, res) {
    return util.format(
      "%s - %s %s %d %d - %d ms",
      ip(req), req.method, req.url,
      res.statusCode, res.get('content-length'),
      (Date.now() - req._startTime)
    );
  }
  function accesslog(req, res) {
    var level = (res.statusCode < 500) ? 'info' : 'warn';
    log[level]({req: req, res: res}, logfmt(req, res));
  }
  /*app.use(function(req, res, next) {
    req._startTime = Date.now();
    res.on('finish', accesslog.bind(null, req, res));
    next();
  });*/
  app.use(app.router);
  app.use(express.static(__dirname + '/../public'));
  /*app.use(function(err, req, res, next) {
    if (err.status) res.statusCode = err.status;
    if (res.statusCode < 400) res.statusCode = 500;
    var accept = req.headers.accept || '';
    res.format({
      text: function() {
        res.send(err.stack);
      },
      html: function() {
        res.send(
          '<title>Unexpected Error</title>' +
          '<h1>Unexpected Error</h1>' +
          '<p>Error details:</p>' +
          '<pre>' + err.stack + '</pre>'
        );
      },
      json: function() {
        var error = { message: err.message, stack: err.stack };
        for (var prop in err) error[prop] = err[prop];
        res.json({error: error});
      },
    })
  });
  app.use(function(req, res) {
    res.statusCode = 404;
    res.format({
      text: function() {
        res.send('Not Found');
      },
      html: function() {
        res.send('<title>Not Found</title><h1>Not Found</h1>');
      },
      json: function() {
        res.json({error: 'Not Found'});
      },
    })
  });*/

  callback(null, app);
}