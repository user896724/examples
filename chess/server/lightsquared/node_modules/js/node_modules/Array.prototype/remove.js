define(function(require) {
	Array.prototype.remove = function(item) {
		var index;
		
		while((index = this.indexOf(item)) !== -1) {
			this.splice(index, 1);
		}
	}
});