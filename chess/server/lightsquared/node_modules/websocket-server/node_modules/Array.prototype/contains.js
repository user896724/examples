define(function(require) {
	Array.prototype.contains = function(item) {
		return (this.indexOf(item) !== -1);
	}
});