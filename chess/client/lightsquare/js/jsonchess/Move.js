define(function(require) {
	var PieceType = require("chess/PieceType");
	var Piece = require("chess/Piece");
	var Colour = require("chess/Colour");
	var Square = require("chess/Square");
	var getEpPawn = require("chess/getEpPawn");
	
	return {
		encodeAndPack: function(move) {
			var castlingRightsLost = "N";
			
			if(move.castlingRightsLost.length === 2) {
				castlingRightsLost = "A";
			}
			
			else if(move.castlingRightsLost.length === 1) {
				castlingRightsLost = move.castlingRightsLost[0].sanString;
			}
			
			var epTarget = move.positionAfter.epTarget;
			
			var moveString = ""
				+ move.fullmove
				+ "," + move.index
				+ "," + move.label
				+ "," + move.time
				+ "," + move.from.algebraic
				+ "," + move.to.algebraic
				+ "," + castlingRightsLost
				+ "," + (epTarget ? epTarget.algebraic : "N");
			
			if(move.isCastling) {
				moveString += ""
					+ ",c,"
					+ move.castlingRookFrom.algebraic
					+ ","
					+ move.castlingRookTo.algebraic;
			}
			
			else if(move.isPromotion) {
				moveString += ",p," + move.promoteTo.sanString;
			}
			
			else if(move.isEnPassant) {
				moveString += ",ep," + getEpPawn(move.from, move.to).algebraic;
			}
			
			return moveString;
		},
		
		unpack: function(string) {
			var fields = string.split(",");
			
			var move = {
				fullmove: parseInt(fields[0]),
				index: parseInt(fields[1]),
				label: fields[2],
				time: parseInt(fields[3]),
				from: Square.byAlgebraic[fields[4]],
				to: Square.byAlgebraic[fields[5]],
				castlingRightsLost: fields[6],
				epTarget: fields[7],
				type: fields[8]
			};
			
			move.epTarget = (move.epTarget === "N" ? null : Square.byAlgebraic[move.epTarget]);
			
			var castlingRightsLost = [];
			
			if(move.castlingRightsLost === "A") {
				castlingRightsLost = [PieceType.king, PieceType.queen];
			}
			
			else if(move.castlingRigtsLost === "K") {
				castlingRightsLost = [PieceType.king];
			}
			
			else if(move.castlingRigtsLost === "Q") {
				castlingRightsLost = [PieceType.queen];
			}
			
			move.castlingRightsLost = castlingRightsLost;
			
			if(move.type === "c") {
				move.castlingRookFrom = Square.byAlgebraic[fields[9]];
				move.castlingRookTo = Square.byAlgebraic[fields[10]];
			}
			
			else if(move.type === "ep") {
				move.epCapture = Square.byAlgebraic[fields[9]];
			}
			
			else if(move.type === "p") {
				move.promoteTo = PieceType.bySanString[fields[9]];
			}
			
			return move;
		},
		
		decode: function(move, position) {
			var positionAfter = position.getCopy();
			
			var label = move.label;
			var index = move.index;
			var fullmove = move.fullmove;
			var from = move.from;
			var to = move.to;
			var type = move.type;
			
			var colour = position.activeColour;
			var fullmoveDot = (colour === Colour.white ? "." : "...");
			var isPromotion = false;
			var promoteTo;
			var isEnPassant = false;
			var isCastling = false;
			var castlingRookFrom = null;
			var castlingRookTo = null;
			var capturedPiece = position.board[to.squareNo];
			var piece = position.board[from.squareNo];
			var isCheck = false;
			var isMate = false;
			
			positionAfter.setPiece(from, null);
			positionAfter.setPiece(to, piece);
			positionAfter.epTarget = move.epTarget;
			
			for(var i = 0; i < move.castlingRightsLost.length; i++) {
				positionAfter.setCastlingRights(colour, move.castlingRightsLost[i], false);
			}
			
			if(type === "c") {
				isCastling = true;
				
				castlingRookFrom = move.castlingRookFrom;
				castlingRookTo = move.castlingRookTo;
				
				positionAfter.setPiece(castlingRookFrom, null);
				positionAfter.setPiece(castlingRookTo, Piece.pieces[PieceType.rook][colour]);
			}
			
			else if(type === "ep") {
				isEnPassant = true;
				capturedPiece = Piece.pieces[PieceType.pawn][colour.opposite];
				positionAfter.setPiece(move.epCapture, null);
			}
			
			else if(type === "p") {
				isPromotion = true;
				promoteTo = move.promoteTo;
				positionAfter.setPiece(to, Piece.pieces[promoteTo][colour]);
			}
			
			
			positionAfter.activeColour = colour.opposite;
			
			if(colour === Colour.black) {
				positionAfter.fullmove++;
			}
			
			if(capturedPiece !== null || piece.type === PieceType.pawn) {
				positionAfter.fiftymoveClock = 0;
			}
			
			else {
				positionAfter.fiftymoveClock++;
			}
			
			var lastChar = label.charAt(label.length - 1);

			return {
				fullmove: fullmove,
				index: index,
				label: label,
				fullLabel: fullmove + fullmoveDot + " " + label,
				uciLabel: from.algebraic + to.algebraic + (isPromotion ? promoteTo.sanString.toLowerCase() : ""),
				colour: colour,
				from: from,
				to: to,
				piece: piece,
				positionBefore: position,
				positionAfter: positionAfter,
				isCheck: (lastChar === "#" || lastChar === "+"),
				isMate: (lastChar === "#"),
				isLegal: true,
				isCastling: isCastling,
				castlingRookFrom: castlingRookFrom,
				castlingRookTo: castlingRookTo,
				castlingRightsLost: move.castlingRightsLost,
				isPromotion: isPromotion,
				promoteTo: promoteTo,
				isEnPassant: isEnPassant,
				capturedPiece: capturedPiece,
				time: move.time
			};
		}
	};
});