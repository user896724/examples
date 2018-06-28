define(function(require) {
	require("css!./promotionDialog.css");
	var html = require("file!./promotionDialog.html");
	var Event = require("js/Event");
	var create = require("dom/create");
	var Template = require("dom/Template");
	var PieceType = require("chess/PieceType");
	var ChessPiece = require("chess/Piece");
	var Colour = require("chess/Colour");
	var Piece = require("lightsquare/Piece/Piece");
	
	function PromotionDialog(pieceSize, parent) {
		this.PieceSelected = new Event();
		
		this._template = new Template(html, parent);
		this._pieces = [];
		
		[
			PieceType.queen,
			PieceType.rook,
			PieceType.bishop,
			PieceType.knight
		].forEach((function(type) {
			var pieceButton = create("div", this._template.pieces);
			var piece = new Piece(pieceButton, pieceSize);
			
			piece.setPiece(ChessPiece.pieces[type][Colour.white]);
			
			this._pieces.push(piece);
			
			pieceButton.addEventListener("click", (function() {
				this.PieceSelected.fire(type);
			}).bind(this));
		}).bind(this));
	}
	
	PromotionDialog.prototype.setPieceStyle = function(pieceStyle) {
		this._pieces.forEach(function(piece) {
			piece.setStyle(pieceStyle);
		});
	}
	
	PromotionDialog.prototype.setColour = function(colour) {
		this._pieces.forEach(function(piece) {
			piece.setPiece(ChessPiece.pieces[piece.getPiece().type][colour]);
		});
	}
	
	return PromotionDialog;
});