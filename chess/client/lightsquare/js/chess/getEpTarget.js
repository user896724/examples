define(function(require) {
	var Square = require("./Square");
	
	return function(from, to) {
		return Square.bySquareNo[to.squareNo - ((to.squareNo - from.squareNo) / 2)];
	}
});