define(function(require) {
	var Colour = require("chess/Colour");

	function Fullmove() {
		this.moves = {};
		this.moves[Colour.white] = null;
		this.moves[Colour.black] = null;
		this.fullmove = null;
	}

	Fullmove.prototype.add = function(move) {
		this.moves[move.colour] = move;
		this.fullmove = move.fullmove;
	}

	Fullmove.prototype.remove = function(move) {
		this.moves[move.colour] = null;
	}

	Fullmove.prototype.isEmpty = function() {
		return (this.moves[Colour.white] === null && this.moves[Colour.black] === null);
	}

	Fullmove.prototype.getLastMove = function() {
		return (this.moves[Colour.black] || this.moves[Colour.white]);
	}

	return Fullmove;
});