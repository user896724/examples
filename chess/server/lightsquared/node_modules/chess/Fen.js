define(function(require) {
	var Position = require("./Position");
	var Piece = require("./Piece");
	var Square = require("./Square");
	var Colour = require("./Colour");
	
	return {
		getPosition: function(fenString) {
			var position = new Position();
			var array = fenString.split(/\s+/);
	
			var board = array[0];
			var active = array[1];
			var castlingRights = array[2];
			var epTarget = array[3];
			var fiftymoveClock = "0";
			var fullmove = "1";
	
			if(array.length > 4) {
				fiftymoveClock = array[4];
			}
	
			if(array.length > 5) {
				fullmove = array[5];
			}
			
			var pieces = [];
			var ranks = board.split("/").reverse();
			var fenChar;
	
			for(i = 0; i < 8; i++) {
				for(var j = 0; j < ranks[i].length; j++) {
					fenChar = ranks[i].charAt(j);
	
					if(fenChar.match(/[pnbrqk]/i)) {
						pieces.push(Piece.byFenString[fenChar]);
					}
	
					else if(fenChar.match(/\d/)) {
						for(var k = 0; k < parseInt(fenChar); k++) {
							pieces.push(null);
						}
					}
				}
			}
			
			pieces.forEach(function(piece, squareNo) {
				position.setPiece(Square.bySquareNo[squareNo], piece);
			});
			
			position.activeColour = Colour.byFenString[active];
			
			if(castlingRights !== "-") {
				castlingRights.split("").forEach(function(fenChar) {
					var piece = Piece.byFenString[fenChar];
					
					position.setCastlingRights(piece.type, piece.colour, true);
				});
			}
			
			if(epTarget === "-") {
				position.epTarget = null;
			}
	
			else {
				position.epTarget = Square.byAlgebraic[epTarget];
			}
	
			position.fiftymoveClock = parseInt(fiftymoveClock);
			position.fullmove = parseInt(fullmove);
			
			return position;
		},
		
		getFenString: function(position) {
			//var fenRanks = [];
			//var ranks = [];
			//
			//for(var i = 56; i > -1; i -= 8) {
			//	ranks.push(board.slice(i, i + 8));
			//}
			//
			//var fenRank;
			//var piece;
			//var emptySquares;
			//
			//for(var i = 0; i < 8; i++) {
			//	emptySquares = 0;
			//	fenRank = "";
			//
			//	for(var j = 0; j < 8; j++) {
			//		piece = ranks[i][j];
			//
			//		if(piece === null) {
			//			emptySquares++;
			//		}
			//
			//		if(emptySquares > 0 && (piece !== null || j === 7)) {
			//			fenRank += emptySquares;
			//			emptySquares = 0;
			//		}
			//
			//		if(piece !== null) {
			//			fenRank += piece.fenString;
			//		}
			//	}
			//
			//	fenRanks.push(fenRank);
			//}
			//
			//return fenRanks.join("/");
		}
	};
});