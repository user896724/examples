define(function(require) {
	var Template = require("dom/Template");
	var html = require("file!./piece.html");
	var style = require("dom/style");

	function Piece(parent, size) {
		this._template = new Template(html, parent);
		this._style = Piece.DEFAULT_STYLE;
		this._piece = null;
		this._size = size || Piece.DEFAULT_SIZE;
		this._template.root.style.backgroundRepeat = "no-repeat";
		this._updateSprite();
	}

	Piece.styles = [
		"Alpha",
		"Classic"
	];
	
	Piece.sizes = {
		"Tiny": 20,
		"Extra small": 30,
		"Small": 45,
		"Medium": 60,
		"Standard": 67,
		"Large": 75,
		"Extra large": 90
	};

	Piece.DEFAULT_SIZE = 67;
	Piece.DEFAULT_STYLE = "Classic";

	Piece.prototype.setPiece = function(piece) {
		if(this._piece !== piece) {
			this._piece = piece;
			this._updateSpriteOffset();
		}
	}
	
	Piece.prototype.getPiece = function() {
		return this._piece;
	}

	Piece.prototype.setStyle = function(style) {
		this._style = style;
		this._updateSpriteImage();
	}

	Piece.prototype.setSize = function(size) {
		this._size = size;
		this._updateSprite();
	}
	
	Piece.prototype._updateSpriteImage = function() {
		this._template.root.style.backgroundImage = "url('" + require.toUrl("./pieces/" + this._style + "/" + this._size + ".png") + "')";
	}
	
	Piece.prototype._updateSize = function() {
		style(this._template.root, {
			width: this._size,
			height: this._size
		});
		
		this._updateSpriteImage();
	}
	
	Piece.prototype._updateSpriteOffset = function() {
		var offset = this._size;
		
		if(this._piece !== null) {
			offset = -"PNBRQKpnbrqk".indexOf(this._piece) * this._size;
		}
		
		this._template.root.style.backgroundPosition = offset + "px 0";
	}
	
	Piece.prototype._updateSprite = function() {
		this._updateSize();
		this._updateSpriteOffset();
	}

	return Piece;
});