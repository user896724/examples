define(function(require) {
	var PieceType = require("chess/PieceType");
	var Square = require("chess/Square");
	var Piece = require("chess/Piece");
	var Coords = require("chess/Coords");
	
	function Premove(position, from, to, promoteTo) {
		this.isValid = false;
		this._position = position;
		this.board = position.board.slice();
		this.from = from;
		this.to = to;
		this.promoteTo = promoteTo || PieceType.queen;
		this.piece = this._position.board[this.from.squareNo];
		
		if(this.piece !== null) {
			this._colour = this.piece.colour;
			this._fromRelative = this.from.adjusted[this._colour];
			this._toRelative = this.to.adjusted[this._colour];
			this._isPromotion = false;
			this._check();
		}
	}
	
	Premove.prototype._check = function() {
		if(this.piece.type === PieceType.pawn) {
			this._checkPawnMove();
		}

		else if(this.piece.type === PieceType.king) {
			this._checkKingMove();
		}

		else {
			this._checkRegularMove();
		}
		
		if(this.isValid) {
			this.board[this.to.squareNo] = (
				this._isPromotion ?
				Piece.pieces[this.promoteTo][this._colour] :
				this.piece
			);
			
			this.board[this.from.squareNo] = null;
		}
	}
	
	Premove.prototype._checkRegularMove = function() {
		this.isValid = this._isRegularShape();
	}
	
	Premove.prototype._isRegularShape = function() {
		var diff = {
			x: Math.abs(this.from.coords.x - this.to.coords.x),
			y: Math.abs(this.from.coords.y - this.to.coords.y)
		};

		if(diff.x === 0 && diff.y === 0) {
			return false;
		}

		switch(this.piece.type) {
			case PieceType.knight: {
				return ((diff.x === 2 && diff.y === 1) || (diff.x === 1 && diff.y === 2));
			}

			case PieceType.bishop: {
				return (diff.x === diff.y);
			}

			case PieceType.rook: {
				return (diff.x === 0 || diff.y === 0);
			}

			case PieceType.queen: {
				return (diff.x === diff.y || (diff.x === 0 || diff.y === 0));
			}

			case PieceType.king: {
				return ((diff.x === 1 || diff.x === 0) && (diff.y === 1 || diff.y === 0));
			}
		}
	}
	
	Premove.prototype._checkPawnMove = function() {
		this.isValid = (
			(this._isPawnShape() || this._isPawnCaptureShape() || this._isDoublePawnShape())
			&& this.promoteTo.isValidPromotion
		);
		
		if(this.isValid) {
			this._isPromotion = this.to.isPromotionRank;
		}
	}
	
	Premove.prototype._isPawnShape = function() {
		return (
			this._toRelative.coords.y - this._fromRelative.coords.y === 1
			&& this.to.coords.x === this.from.coords.x
		);
	}
	
	Premove.prototype._isPawnCaptureShape = function() {
		return (
			this._toRelative.coords.y - this._fromRelative.coords.y === 1
			&& Math.abs(this.to.coords.x - this.from.coords.x) === 1
		);
	}
	
	Premove.prototype._isDoublePawnShape = function() {
		return (
			this._fromRelative.coords.y === 1
			&& this._toRelative.coords.y === 3
			&& this.to.coords.x === this.from.coords.x
		);
	}
	
	Premove.prototype._checkKingMove = function() {
		this._checkRegularMove();

		if(!this.isValid) {
			this._checkCastlingMove();
		}
	}

	Premove.prototype._checkCastlingMove = function() {
		var file = (this.to.squareNo < this.from.squareNo ? "a" : "h");
		var rookFromX = (file === "a" ? 0 : 7);
		var rookToX = (file === "a" ? 3 : 5);
		var rookFrom = Square.byCoords[rookFromX][this.from.coords.y];
		var rookTo = Square.byCoords[rookToX][this.from.coords.y];
		
		if(
			Math.abs(this.to.coords.x - this.from.coords.x) === 2
			&& !this._position.moveIsBlocked(this.from, this.to)
			&& this._position.getCastlingRights(this._colour, file)
			&& this._position.board[rookFrom.squareNo] === Piece.pieces[PieceType.rook][this._colour]
		) {
			this.isValid = true;
			this.board[rookFrom.squareNo] = null;
			this.board[rookTo.squareNo] = Piece.pieces[PieceType.rook][this._colour];
		}
	}
	
	Premove.prototype.toJSON = function() {
		return {
			from: this.from.squareNo,
			to: this.to.squareNo,
			promoteTo: (this._isPromotion ? this.promoteTo.sanString : undefined)
		};
	}
	
	return Premove;
});