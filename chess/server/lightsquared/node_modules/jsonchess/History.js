define(function(require) {
	var Move = require("./Move");
	var Position = require("chess/Position");
	
	return {
		decode: function(history) {
			var position = new Position();
			
			return history.map(function(move) {
				move = Move.decode(Move.unpack(move), position);
				position = move.positionAfter;
				
				return move;
			});
		}
	};
});