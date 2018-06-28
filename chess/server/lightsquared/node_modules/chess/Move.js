define(function(require) {
	var time = require("js/time");
	var Colour = require("./Colour");
	var PieceType = require("./PieceType");
	var Piece = require("./Piece");
	var Square = require("./Square");
	var getEpPawn = require("./getEpPawn");
	var getEpTarget = require("./getEpTarget");
	
	var signs = {
		castling: {
			K: "O-O",
			Q: "O-O-O"
		},
		capture: "x",
		check: "+",
		mate: "#",
		promotion: "="
	};

	function Move(position, from, to, promoteTo) {
		this.positionBefore = position.getCopy();
		this.positionAfter = position.getCopy();
		this.from = from;
		this.to = to;
		this.promoteTo = promoteTo || PieceType.queen;
		this.time = time();

		this.capturedPiece = this.positionBefore.board[this.to.squareNo];
		this.piece = this.positionBefore.board[this.from.squareNo];

		this.colour = this.positionBefore.activeColour;
		this.fullmove = position.fullmove;
		this.index = (this.fullmove - 1) * 2 + (this.colour === Colour.black ? 1 : 0);
		
		this._fromRelative = this.from.adjusted[this.colour];
		this._toRelative = this.to.adjusted[this.colour];

		this._label = {
			piece: "",
			disambiguation: "",
			sign: "",
			to: "",
			special: "",
			check: "",
			notes: ""
		};
		
		this.label = "";
		this.fullLabel = "";
		this.uciLabel = "";
		this._hasLabels = false;
		
		this.isCastling = false;
		this.castlingRookFrom = null;
		this.castlingRookTo = null;
		this.castlingRightsLost = [];
		this.isPromotion = false;
		this.isEnPassant = false;

		this._isUnobstructed = (
			!this.positionBefore.moveIsBlocked(this.from, this.to)
			&& (this.capturedPiece === null || this.capturedPiece.colour === this.colour.opposite)
		);

		this._isValid = false;
		this.isLegal = false;

		this.isCheck = null;
		this.isMate = null;
		this._hasCheckedForCheck = false;
		this._hasCheckedForMate = false;

		this._check();
	}
	
	Move.prototype.checkCheckAndMate = function() {
		this._checkCheck();
		this._checkMate();
	}
	
	Move.prototype.generateLabels = function() {
		if(!this._hasLabels) {
			this.checkCheckAndMate();
			
			if(this.isMate) {
				this._label.check = signs.mate;
			}
			
			else if(this.isCheck) {
				this._label.check = signs.check;
			}
			
			this.label = ""
				+ this._label.piece
				+ this._label.disambiguation
				+ this._label.sign
				+ this._label.to
				+ this._label.special
				+ this._label.check
				+ this._label.notes;
			
			this.fullLabel = ""
				+ this.fullmove
				+ (this.colour === Colour.white ? "." : "...") + " " 
				+ this.label;
			
			this._hasLabels = true;
		}
	}

	Move.prototype._check = function() {
		if(this.piece !== null && this.piece.colour === this.colour && this._isUnobstructed) {
			if(this.piece.type === PieceType.pawn) {
				this._checkPawnMove();
			}

			else if(this.piece.type === PieceType.king) {
				this._checkKingMove();
			}

			else {
				this._checkRegularMove();
			}

			this.isLegal = (this._isValid && !this.positionAfter.playerIsInCheck(this.colour));

			if(this.isLegal) {
				if(this.colour === Colour.black) {
					this.positionAfter.fullmove++;
				}

				this.positionAfter.activeColour = this.colour.opposite;

				if(this.capturedPiece !== null || this.piece.type === PieceType.pawn) {
					this.positionAfter.fiftymoveClock = 0;
				}

				else {
					this.positionAfter.fiftymoveClock++;
				}

				if(this.piece.type !== PieceType.pawn || !this._isDoublePawnShape()) {
					this.positionAfter.epTarget = null;
				}

				if(this.piece.type === PieceType.king) {
					this.positionAfter.setCastlingRights(this.colour, PieceType.king, false);
					this.positionAfter.setCastlingRights(this.colour, PieceType.queen, false);
					this.castlingRightsLost = [PieceType.king, PieceType.queen];
				}

				else if(this.piece.type === PieceType.rook) {
					if(
						(this.from.file === "a" || this.from.file === "h")
						&& this.from.adjusted[this.colour].coords.x === 0
					) {
						var side = (this.from.file === "a" ? PieceType.queen : PieceType.king);
						
						this.positionAfter.setCastlingRights(this.colour, side, false);
						this.castlingRightsLost = [side];
					}
				}
				
				this.uciLabel = ""
					+ this.from.algebraic
					+ this.to.algebraic
					+ (this.isPromotion ? this.promoteTo.sanString.toLowerCase() : "");
			}
		}
	}

	Move.prototype._checkRegularMove = function() {
		if(this._isRegularShape()) {
			this._isValid = true;
			this.positionAfter.setPiece(this.from, null);
			this.positionAfter.setPiece(this.to, this.positionBefore.board[this.from.squareNo]);
			this._label.piece = this.piece.type.sanString;
			this._label.to = this.to.algebraic;

			if(this.piece.type !== PieceType.king) {
				this._label.disambiguation = this._getDisambiguationString();
			}

			if(this.capturedPiece !== null) {
				this._label.sign = signs.capture;
			}
		}
	}
	
	Move.prototype._isRegularShape = function() {
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

	Move.prototype._checkPawnMove = function() {
		var isCapturing = this._isPawnCaptureShape();
		var isEnPassant = false;
		var isDouble = false;
		var isPromotion = false;
		var isValidPromotion = false;

		if(this.to.isPromotionRank) {
			isPromotion = true;
			isValidPromotion = this.promoteTo.isValidPromotion;
		}

		if(isValidPromotion || !isPromotion) {
			if(this.capturedPiece === null) {
				if(this._isDoublePawnShape()) {
					this._isValid = true;
					
					isDouble = true;
				}

				else if(this._isPawnShape()) {
					this._isValid = true;
				}

				else if(isCapturing && this.to === this.positionBefore.epTarget) {
					this._isValid = true;
					
					isEnPassant = true;
				}
			}

			else if(isCapturing) {
				this._isValid = true;
			}
		}

		if(this._isValid) {
			this.isPromotion = isPromotion;
			this.isEnPassant = isEnPassant;
			
			if(isCapturing) {
				this._label.disambiguation = this.from.file;
				this._label.sign = signs.capture;

				if(isEnPassant) {
					this.positionAfter.setPiece(getEpPawn(this.from, this.to), null);
					this.capturedPiece = Piece.pieces[PieceType.pawn][this.colour.opposite];
				}
			}

			if(isDouble) {
				this.positionAfter.epTarget = getEpTarget(this.from, this.to);
			}

			this._label.to = this.to.algebraic;
			this.positionAfter.setPiece(this.from, null);

			if(isPromotion) {
				this.positionAfter.setPiece(this.to, Piece.pieces[this.promoteTo][this.colour]);
				this._label.special = signs.promotion + this.promoteTo.sanString;
			}

			else {
				this.positionAfter.setPiece(this.to, this.positionBefore.board[this.from.squareNo]);
			}
		}
	}
	
	Move.prototype._isPawnShape = function() {
		return (
			this._toRelative.coords.y - this._fromRelative.coords.y === 1
			&& this.to.coords.x === this.from.coords.x
		);
	}
	
	Move.prototype._isPawnCaptureShape = function() {
		return (
			this._toRelative.coords.y - this._fromRelative.coords.y === 1
			&& Math.abs(this.to.coords.x - this.from.coords.x) === 1
		);
	}
	
	Move.prototype._isDoublePawnShape = function() {
		return (
			this._fromRelative.coords.y === 1
			&& this._toRelative.coords.y === 3
			&& this.to.coords.x === this.from.coords.x
		);
	}

	Move.prototype._checkKingMove = function() {
		this._checkRegularMove();

		if(!this._isValid) {
			this._checkCastlingMove();
		}
	}

	Move.prototype._checkCastlingMove = function() {
		var side = (this.to.squareNo < this.from.squareNo ? PieceType.queen : PieceType.king);
		var homeRankY = (this.colour === Colour.white ? 0 : 7);
		var rookFromX = (side === PieceType.queen ? 0 : 7);
		var rookToX = (side === PieceType.queen ? 3 : 5);
		var rookFrom = Square.byCoords[rookFromX][this.from.coords.y];
		var rookTo = Square.byCoords[rookToX][this.from.coords.y];
		
		if(
			Math.abs(this.to.coords.x - this.from.coords.x) === 2
			&& this.from.coords.y === homeRankY
			&& this.to.coords.y === homeRankY
			&& !this.positionBefore.moveIsBlocked(this.from, rookFrom)
			&& this.positionBefore.getCastlingRights(this.colour, side)
			&& this.positionBefore.board[rookFrom.squareNo] === Piece.pieces[PieceType.rook][this.colour]
			&& !this.positionBefore.playerIsInCheck(this.colour)
			&& this.positionBefore.getAllAttackers(rookTo, this.colour.opposite).length === 0
		) {
			this._isValid = true;
			this.isCastling = true;
			this.castlingRookFrom = rookFrom,
			this.castlingRookTo = rookTo;
			this._label.special = signs.castling[side];
			this.positionAfter.setPiece(this.from, null);
			this.positionAfter.setPiece(this.to, Piece.pieces[PieceType.king][this.colour]);
			this.positionAfter.setPiece(rookFrom, null);
			this.positionAfter.setPiece(rookTo, Piece.pieces[PieceType.rook][this.colour]);
		}
	}

	Move.prototype._checkCheck = function() {
		if(!this._hasCheckedForCheck) {
			this.isCheck = (this.isLegal && this.positionAfter.playerIsInCheck(this.colour.opposite));
			this._hasCheckedForCheck = true;
		}
	}

	Move.prototype._checkMate = function() {
		this._checkCheck();
		
		if(!this._hasCheckedForMate) {
			this.isMate = (this.isLegal && this.isCheck && this.positionAfter.countLegalMoves() === 0);
			this._hasCheckedForMate = true;
		}
	}

	Move.prototype._getDisambiguationString = function() {
		var disambiguationString = "";
		var piecesInRange = this.positionBefore.getAttackers(this.piece.type, this.to, this.colour);

		var disambiguation = {
			file: "",
			rank: ""
		};

		var square;

		for(var i = 0; i < piecesInRange.length; i++) {
			square = piecesInRange[i];

			if(square !== this.from) {
				if(square.file === this.from.file) {
					disambiguation.rank = this.from.rank;
				}

				if(square.rank === this.from.rank) {
					disambiguation.file = this.from.file;
				}
			}
		}

		disambiguationString = disambiguation.file + disambiguation.rank;

		if(piecesInRange.length > 1 && disambiguationString === "") {
			disambiguationString = this.from.file;
		}

		return disambiguationString;
	}

	return Move;
});