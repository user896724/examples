define(function(require) {
	var Colour = require("./Colour");
	
	var values = {
		"P": 1,
		"K": 3,
		"B": 3,
		"R": 5,
		"Q": 9,
		"K": Infinity
	};
	
	function PieceType(sanString) {
		this.sanString = sanString;
		this.value = values[sanString];
		this.fenStrings = {};
		this.fenStrings[Colour.white] = sanString.toUpperCase();
		this.fenStrings[Colour.black] = sanString.toLowerCase();
		this.isValidPromotion = !!sanString.match(/[NBRQ]/);
	}
	
	PieceType.prototype.toString = function() {
		return this.sanString;
	}
	
	var types = {
		"P": new PieceType("P"),
		"N": new PieceType("N"),
		"B": new PieceType("B"),
		"R": new PieceType("R"),
		"Q": new PieceType("Q"),
		"K": new PieceType("K")
	};
	
	return {
		pawn: types["P"],
		knight: types["N"],
		bishop: types["B"],
		rook: types["R"],
		queen: types["Q"],
		king: types["K"],
		
		bySanString: types,
		
		forEach: function(callback) {
			for(var sanString in types) {
				callback(types[sanString]);
			}
		}
	};
});