exports.Conglomerate = Conglomerate;

function Conglomerate(logger, express, amqp, level) {
  this.log = logger;
  this.app = express;
  this.amqp = amqp;
  this.level = level;
  this.things = [];
}
Conglomerate.prototype.addThing = function(name, callback) {
  var thing = require('./things/'+name+'.js')({
    log: this.log.child({type: 'thing:' + name}),
    app: this.app, amqp: this.amqp, level: this.level
  }, callback);
  this.things.push(thing);
}
Conglomerate.prototype.run = function() {
  this.log.info("Starting things running");
  this.things.forEach(function(thing) {
    thing.run();
  })
};