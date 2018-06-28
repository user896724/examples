define(function(require) {
	var Square = require("./Square");
	
	return function(from, to) {
		return Square.byCoords[to.coords.x][from.coords.y];
	}
});