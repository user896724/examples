define(function(require) {
	Array.prototype.filterInPlace = function(test) {
		for(var i = 0; i < this.length; i++) {
			if(!test(this[i])) {
				this.splice(i, 1);
				i--;
			}
		}
	}
});