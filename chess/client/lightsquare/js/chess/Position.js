define(function(require) {
	var clone = require("js/clone");
	var Colour = require("./Colour");
	var PieceType = require("./PieceType");
	var Piece = require("./Piece");
	var Move = require("./Move");
	var Square = require("./Square");
	var getInitialBoard = require("./getInitialBoard");
	
	function Position() {
		this.board = getInitialBoard();
		this.castlingRights = {K: true, Q: true, k: true, q: true};
		this.activeColour = Colour.white;
		this.epTarget = null;
		this.fiftymoveClock = 0;
		this.fullmove = 1;
		this.kingPositions = {w: Square.byAlgebraic.e1, b: Square.byAlgebraic.e8};
	}
	
	Position.prototype.isThreefoldRepeatOf = function(position) {
		if(
			position.epTarget !== this.epTarget
			|| position.activeColour !== this.activeColour
			|| JSON.stringify(position.castlingRights) !== JSON.stringify(this.castlingRights)
		) {
			return false;
		}
		
		for(var i = 0; i < 64; i++) {
			if(position.board[i] !== this.board[i]) {
				return false;
			}
		}
		
		return true;
	}
	
	Position.prototype.setCastlingRights = function(colour, side, allow) {
		this.castlingRights[Piece.pieces[side][colour].fenString] = allow;
	}
	
	Position.prototype.getCastlingRights = function(colour, side) {
		return this.castlingRights[Piece.pieces[side][colour].fenString];
	}
	
	Position.prototype.setPiece = function(square, piece) {
		this.board[square.squareNo] = piece;
		
		if(piece && piece.type === PieceType.king) {
			this.kingPositions[piece.colour] = square;
		}
	}

	Position.prototype.getCopy = function() {
		var position = new Position();
		
		position.board = this.board.slice();
		position.castlingRights = clone(this.castlingRights);
		position.activeColour = this.activeColour;
		position.epTarget = this.epTarget;
		position.fiftymoveClock = this.fiftymoveClock;
		position.fullmove = this.fullmove;
		position.kingPositions = clone(this.kingPositions);
		
		return position;
	}

	Position.prototype.playerIsMated = function(colour) {
		return (this.playerIsInCheck(colour) && this.countLegalMoves() === 0);
	}
	
	Position.prototype.getLegalMoves = function() {
		var legalMoves = [];

		for(var i = 0; i < 64; i++) {
			var from = Square.bySquareNo[i];
			var piece = this.board[i];

			if(piece !== null && piece.colour === this.activeColour) {
				legalMoves = legalMoves.concat(this.getLegalMovesFromSquare(from).map(function(to) {
					return {
						from: from,
						to: to
					};
				}));
			}
		}

		return legalMoves;
	}

	Position.prototype.countLegalMoves = function() {
		var legalMoves = 0;
		var piece, square;

		for(var i = 0; i < 64; i++) {
			square = Square.bySquareNo[i];
			piece = this.board[i];

			if(piece !== null && piece.colour === this.activeColour) {
				legalMoves += this.getLegalMovesFromSquare(square).length;
			}
		}

		return legalMoves;
	}

	Position.prototype.getLegalMovesFromSquare = function(square) {
		var legalMoves = [];
		var piece = this.board[square.squareNo];
		var reachableSquares;

		if(piece !== null) {
			reachableSquares = Position.getReachableSquares(piece.type, square, piece.colour);

			for(var i = 0; i < reachableSquares.length; i++) {
				if((new Move(this, square, reachableSquares[i])).isLegal) {
					legalMoves.push(reachableSquares[i]);
				}
			}
		}
		
		return legalMoves;
	}
	
	Position.prototype.getAttackers = function(pieceType, square, colour) {
		if(pieceType === PieceType.pawn) {
			return this.getPawnAttackers(square, colour);
		}

		else if(pieceType === PieceType.king) {
			return this.getKingAttackers(square, colour);
		}

		else {
			return this.getRegularAttackers(pieceType, square, colour);
		}
	}

	Position.prototype.getPawnAttackers = function(square, colour) {
		var attackers = [];
		var piece = Piece.pieces[PieceType.pawn][colour];
		var candidateSquare;
		var coords;

		for(var x = -1; x <= 1; x += 2) {
			coords = square.adjusted[colour].coords.add(x, -1);
			
			if(coords.isOnBoard) {
				candidateSquare = Square.byCoords[coords.x][coords.y].adjusted[colour];

				if(this.board[candidateSquare.squareNo] === piece) {
					attackers.push(candidateSquare);
				}
			}
		}

		return attackers;
	}

	Position.prototype.getKingAttackers = function(square, colour) {
		var attackers = [];
		var piece = Piece.pieces[PieceType.king][colour];
		var coords, candidateSquare;

		for(var x = -1; x <= 1; x++) {
			for(var y = -1; y <= 1; y++) {
				coords = square.coords.add(x, y);
				
				if(coords.isOnBoard) {
					candidateSquare = Square.byCoords[coords.x][coords.y];

					if(this.board[candidateSquare.squareNo] === piece && candidateSquare !== square) {
						attackers.push(candidateSquare);
					}
				}
			}
		}

		return attackers;
	}

	Position.prototype.getRegularAttackers = function(pieceType, square, colour) {
		var attackers = [];
		var piece = Piece.pieces[pieceType][colour];
		var candidateSquares = Position.getReachableSquares(pieceType, square, colour);
		var candidateSquare;

		for(var i = 0; i < candidateSquares.length; i++) {
			candidateSquare = candidateSquares[i];

			if(this.board[candidateSquare.squareNo] === piece && !this.moveIsBlocked(square, candidateSquare)) {
				attackers.push(candidateSquare);
			}
		}

		return attackers;
	}

	Position.prototype.getAllAttackers = function(square, colour) {
		var attackers = [];
		
		PieceType.forEach((function(pieceType) {
			attackers = attackers.concat(this.getAttackers(pieceType, square, colour));
		}).bind(this));

		return attackers;
	}
	
	Position.prototype.playerIsInCheck = function(colour) {
		return (this.getAllAttackers(this.kingPositions[colour], colour.opposite).length > 0);
	}
	
	Position.prototype.playerCanMate = function(colour) {
		var pieces = {};
		var bishops = {};
		var knights = {};

		pieces[PieceType.knight] = 0;
		pieces[PieceType.bishop] = 0;
		bishops[Colour.white] = 0;
		bishops[Colour.black] = 0;
		knights[Colour.white] = 0;
		knights[Colour.black] = 0;

		var piece;

		for(var square = 0; square < 64; square++) {
			piece = this.board[square];

			if(piece !== null && piece.type !== PieceType.king) {
				if(
					piece.colour === colour
					&& ([PieceType.pawn, PieceType.rook, PieceType.queen].indexOf(piece.type) !== -1)
				) {
					return true;
				}

				if(piece.type === PieceType.bishop) {
					bishops[piece.colour]++;
					pieces[PieceType.bishop]++;
				}

				if(piece.type === PieceType.knight) {
					knights[piece.colour]++;
					pieces[PieceType.knight]++;
				}
			}
		}

		return (
			(bishops[Colour.white] > 0 && bishops[Colour.black] > 0)
			|| (pieces[PieceType.bishop] > 0 && pieces[PieceType.knight] > 0)
			|| (pieces[PieceType.knight] > 2 && knights[colour] > 0)
		);
	}
	
	Position.prototype.moveIsBlocked = function(from, to) {
		var squares = Position.getSquaresBetween(from, to);

		for(var i = 0; i < squares.length; i++) {
			if(this.board[squares[i].squareNo] !== null) {
				return true;
			}
		}

		return false;
	}
	
	Position.getSquaresBetween = function(a, b, inclusive) {
		var squares = [];

		var lower = Math.min(a.squareNo, b.squareNo);
		var upper = Math.max(a.squareNo, b.squareNo);

		a = Square.bySquareNo[lower];
		b = Square.bySquareNo[upper];

		var coordsDifference = {
			x: Math.abs(b.coords.x - a.coords.x),
			y: Math.abs(b.coords.y - a.coords.y)
		};
		
		var difference = upper - lower;
		var distanceInSquares = 0;
		var increment;
		
		if(coordsDifference.x === coordsDifference.y) {
			distanceInSquares = coordsDifference.x;
		}

		else if(coordsDifference.x === 0 || coordsDifference.y === 0) {
			distanceInSquares = (difference > 7 ? difference / 8 : difference);
		}

		if(distanceInSquares > 0) {
			increment = difference / distanceInSquares;
			
			for(var squareNo = lower + increment; squareNo < upper; squareNo += increment) {
				squares.push(Square.bySquareNo[squareNo]);
			}
			
			if(inclusive) {
				squares.push(a);
				squares.push(b);
			}
		}
		
		return squares;
	}
	
	Position.getReachableSquares = function(pieceType, from, colour) {
		var squares = [];

		switch(pieceType) {
			case PieceType.pawn: {
				var fromRelative = from.adjusted[colour];

				if(fromRelative.coords.y === 1) {
					squares.push(Square.bySquareNo[fromRelative.squareNo + 16].adjusted[colour]);
				}
				
				var coords;

				for(var x = -1; x <= 1; x++) {
					coords = fromRelative.coords.add(x, 1);

					if(coords.isOnBoard) {
						squares.push(Square.byCoords[coords.x][coords.y].adjusted[colour]);
					}
				}

				break;
			}

			case PieceType.knight: {
				var xDiffs = [-1, -1, 1, 1, -2, -2, 2, 2];
				var yDiffs = [-2, 2, -2, 2, 1, -1, 1, -1];
				var coords;

				for(var i = 0; i < 8; i++) {
					coords = from.coords.add(xDiffs[i], yDiffs[i]);

					if(coords.isOnBoard) {
						squares.push(Square.byCoords[coords.x][coords.y]);
					}
				}

				break;
			}

			case PieceType.bishop: {
				var directions = [[-1, 1], [1, 1], [1, -1], [-1, -1]];
				var coords;
				
				directions.forEach(function(coordPair) {
					coords = from.coords;
					
					while(true) {
						coords = coords.add(coordPair[0], coordPair[1]);
						
						if(coords.isOnBoard) {
							squares.push(Square.byCoords[coords.x][coords.y]);
						}
						
						else {
							break;
						}
					}
				});
				
				break;
			}

			case PieceType.rook: {
				var squareOnSameRank, squareOnSameFile;

				for(var n = 0; n < 8; n++) {
					squareOnSameRank = Square.byCoords[n][from.coords.y];
					squareOnSameFile = Square.byCoords[from.coords.x][n];

					if(squareOnSameRank !== from) {
						squares.push(squareOnSameRank);
					}

					if(squareOnSameFile !== from) {
						squares.push(squareOnSameFile);
					}
				}

				break;
			}

			case PieceType.queen: {
				var rookSquares = Position.getReachableSquares(PieceType.rook, from, colour);
				var bishopSquares = Position.getReachableSquares(PieceType.bishop, from, colour);

				squares = rookSquares.concat(bishopSquares);

				break;
			}

			case PieceType.king: {
				var coords, candidateSquare;
		
				for(var x = -1; x <= 1; x++) {
					for(var y = -1; y <= 1; y++) {
						coords = from.coords.add(x, y);
						
						if(coords.isOnBoard && !coords.equals(from.coords)) {
							squares.push(Square.byCoords[coords.x][coords.y]);
						}
					}
				}
				
				var kingHomeSquare = Square.byAlgebraic[colour === Colour.black ? "e8" : "e1"];

				if(from === kingHomeSquare) {
					squares = squares.concat([
						Square.byCoords[from.coords.x + 2][kingHomeSquare.coords.y],
						Square.byCoords[from.coords.x - 2][kingHomeSquare.coords.y]
					]);
				}

				break;
			}
		}

		return squares;
	}

	return Position;
});