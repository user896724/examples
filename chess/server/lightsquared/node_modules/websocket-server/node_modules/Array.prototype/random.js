define(function(require) {
	Array.prototype.random = function() {
		return this[Math.floor(Math.random() * this.length)];
	}
});