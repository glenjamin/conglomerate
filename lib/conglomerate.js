exports.Conglomerate = Conglomerate;

function Conglomerate(logger) {
  this.log = logger;
}
Conglomerate.prototype.run = function() {
  this.log.info("Started");
};