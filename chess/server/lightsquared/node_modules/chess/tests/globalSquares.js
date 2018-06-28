define(function(require) {
	var Square = require("../Square");
	
	for(var i = 0; i < 64; i++) {
		global[Square.bySquareNo[i].algebraic] = Square.bySquareNo[i];
	}
});