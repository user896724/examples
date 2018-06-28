define(function(require) {
	var Colour = require("./Colour");
	var PieceType = require("./PieceType");
	var Piece = require("./Piece");
	
	var initialBoard = [
		Piece.pieces[PieceType.rook][Colour.white],
		Piece.pieces[PieceType.knight][Colour.white],
		Piece.pieces[PieceType.bishop][Colour.white],
		Piece.pieces[PieceType.queen][Colour.white],
		Piece.pieces[PieceType.king][Colour.white],
		Piece.pieces[PieceType.bishop][Colour.white],
		Piece.pieces[PieceType.knight][Colour.white],
		Piece.pieces[PieceType.rook][Colour.white],
		Piece.pieces[PieceType.pawn][Colour.white],
		Piece.pieces[PieceType.pawn][Colour.white],
		Piece.pieces[PieceType.pawn][Colour.white],
		Piece.pieces[PieceType.pawn][Colour.white],
		Piece.pieces[PieceType.pawn][Colour.white],
		Piece.pieces[PieceType.pawn][Colour.white],
		Piece.pieces[PieceType.pawn][Colour.white],
		Piece.pieces[PieceType.pawn][Colour.white],
		null, null, null, null, null, null, null, null,
		null, null, null, null, null, null, null, null,
		null, null, null, null, null, null, null, null,
		null, null, null, null, null, null, null, null,
		Piece.pieces[PieceType.pawn][Colour.black],
		Piece.pieces[PieceType.pawn][Colour.black],
		Piece.pieces[PieceType.pawn][Colour.black],
		Piece.pieces[PieceType.pawn][Colour.black],
		Piece.pieces[PieceType.pawn][Colour.black],
		Piece.pieces[PieceType.pawn][Colour.black],
		Piece.pieces[PieceType.pawn][Colour.black],
		Piece.pieces[PieceType.pawn][Colour.black],
		Piece.pieces[PieceType.rook][Colour.black],
		Piece.pieces[PieceType.knight][Colour.black],
		Piece.pieces[PieceType.bishop][Colour.black],
		Piece.pieces[PieceType.queen][Colour.black],
		Piece.pieces[PieceType.king][Colour.black],
		Piece.pieces[PieceType.bishop][Colour.black],
		Piece.pieces[PieceType.knight][Colour.black],
		Piece.pieces[PieceType.rook][Colour.black]
	];
	
	return function() {
		return initialBoard.slice();
	}
});