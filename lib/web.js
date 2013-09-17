var express = require('express');

module.exports = function(log, callback) {
  var app = express();

  app.set('log', log);

  app.use(express.compress());
  app.use(app.router);
  app.use(express.static(__dirname + '../public'));

  callback(null, app);
}