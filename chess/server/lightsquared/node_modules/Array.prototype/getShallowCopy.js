define(function(require) {
	Array.prototype.getShallowCopy = function() {
		return this.slice(0);
	}
});