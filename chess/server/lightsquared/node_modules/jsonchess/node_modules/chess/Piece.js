define(function(require) {
	var Colour = require("./Colour");
	var PieceType = require("./PieceType");
	
	function Piece(type, colour) {
		this.type = type;
		this.colour = colour;
		this.fenString = this.type.fenStrings[colour];
		this.value = this.type.value;
	}
	
	Piece.prototype.toString = function() {
		return this.fenString;
	}
	
	var pieces = {};
	var piecesByFenString = {};
	var piece;
	
	PieceType.forEach(function(type) {
		pieces[type] = {};
		
		Colour.forEach(function(colour) {
			piece = new Piece(type, colour);
			pieces[type][colour] = piece;
			piecesByFenString[piece.fenString] = piece;
		});
	});

	return {
		pieces: pieces,
		byFenString: piecesByFenString
	};
});