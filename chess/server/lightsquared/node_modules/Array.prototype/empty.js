define(function(require) {
	Array.prototype.empty = function() {
		this.splice(0, this.length);
	}
});