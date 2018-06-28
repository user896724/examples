define(function(require) {
	require("css!./game_page.css");
	var html = require("file!./game_page.html");
	var controlsHtml = require("file!./controls.html");
	var objToArray = require("js/objToArray");
	var RactiveI18n = require("ractive-i18n/RactiveI18n");
	var Event = require("js/Event");
	var jsonChessConstants = require("jsonchess/constants");
	var Colour = require("chess/Colour");
	var Move = require("chess/Move");
	var Time = require("chess/Time");
	var PieceType = require("chess/PieceType");
	var Chat = require("./_Chat/Chat");
	var Board = require("lightsquare/Board/Board");
	var History = require("lightsquare/History/History");
	
	var CAPTURED_PIECE_SIZE = 20;
	
	var viewRelevance = {
		player: "player",
		opponent: "opponent"
	};
	
	function GamePage(game, user, server, parent) {
		this.Rematch = new Event();
		this.GameOver = new Event();
		this.Move = new Event();
		this.Aborted = new Event();
		
		this._user = user;
		this._server = server;
		this._viewingAsPreference = null;
		this._viewingAs = Colour.white;
		this._pendingPremove = null;
		this._clockUpdateInterval = null;
		this._newSeekTimeoutAnimation = null;
		this._isVisible = false;
		
		this._setupTemplate(parent);
		this._setupGame(game);
		this._populateTemplate();
		this._handleConnectionStatusMessages();
		this._setupChat();
		this._setupBoard();
		this._setupHistory();
		this._setupGameControls();
		this._setupPrefsPanel();
		this._checkForPendingPremove();
		this._handleUserEvents();
		this._updateUserDependentElements();
		this._updateNewSeek();
	}
	
	GamePage.prototype.getUserColour = function() {
		return this._game.getUserColour();
	}
	
	GamePage.prototype.userIsPlaying = function() {
		return this._game.userIsPlaying();
	}
	
	GamePage.prototype.getStartTime = function() {
		return this._game.startTime;
	}
	
	GamePage.prototype.getTimingStyle = function() {
		return this._game.timingStyle;
	}
	
	GamePage.prototype.getPlayerName = function(colour) {
		return this._game.getPlayerName(colour);
	}
	
	GamePage.prototype.getTimeLeft = function(colour) {
		return this._game.getTimeLeft(colour);
	}
	
	GamePage.prototype.getId = function() {
		return this._game.id;
	}
	
	GamePage.prototype.gameIsInProgress = function() {
		return this._game.isInProgress;
	}
	
	GamePage.prototype._setupGame = function(game) {
		this._game = game;
		
		var applyMove = (function(move) {
			this._history.select(move);
			this._clearPremove();
		}).bind(this);
		
		this._game.Move.addHandler(function(move) {
			this._history.move(move);
			this._template.set("viewingActivePlayer", (this._game.position.activeColour === this._viewingAs));
			this._template.set("userIsActivePlayer", this.userIsActivePlayer());
			this._template.set("drawOffered", false);
			this._template.set("canClaimDraw", this._game.isDrawClaimable());
			this._board.unhighlightSquares();
			this._highlightMove(move);
			
			if(move.colour === this.getUserColour()) {
				this._board.move(move);
				applyMove(move);
			}
			
			else {
				this._board.animateMove(move, function() {
					applyMove(move);
				});
			}
			
			if(move.capturedPiece) {
				this._addCapturedPiece(move.capturedPiece);
			}
			
			this.Move.fire(move);
		}, this);
		
		this._game.DrawOffered.addHandler(function() {
			this._template.set("drawOffered", true);
		}, this);
		
		this._game.RematchOffered.addHandler(function(colour) {
			this._updateRematchOffer();
		}, this);
		
		this._game.RematchDeclined.addHandler(function() {
			this._updateRematchOffer();
		}, this);
		
		this._game.RematchOfferCanceled.addHandler(function() {
			this._updateRematchOffer();
		}, this);
		
		this._game.RematchOfferExpired.addHandler(function() {
			this._updateRematchOffer();
		}, this);
		
		this._game.Rematch.addHandler(function(game) {
			this._setupGame(game);
			this._populateTemplate();
			this._updateBoard();
			this._updateHistory();
			
			if(this.userIsPlaying()) {
				this._viewingAsPreference = null;
			}
			
			this._updateUserDependentElements();
			this.Rematch.fire(game);
		}, this);
		
		this._game.GameOver.addHandler(function(result) {
			this._template.set("result", result);
			this._template.set("isInProgress", false);
			this._clearPremove();
			this._updateClocks();
			this._updateScores();
			this._stopUpdatingClocks();
			this.GameOver.fire(result);
		}, this);
		
		this._game.Aborted.addHandler(function() {
			this._template.set("isInProgress", false);
			this._clearPremove();
			this._stopUpdatingClocks();
			this.Aborted.fire();
		}, this);
		
		if(this._isVisible) {
			this._startUpdatingClocks();
		}
	}
	
	GamePage.prototype._getPlayerColour = function(player) {
		var playerColour = null;
		
		Colour.forEach(function(colour) {
			if(this._game.getPlayer(colour) === player) {
				playerColour = colour;
			}
		}, this);
		
		return playerColour;
	}
	
	GamePage.prototype._handleConnectionStatusMessages = function() {
		this._game.getPlayers().forEach(function(player) {
			this._server.subscribe("/player_connection_status/" + player.id, (function(isConnected) {
				this._updateConnectionStatus(player, isConnected);
			}).bind(this));
		}, this);
	}
	
	GamePage.prototype._updateConnectionStatus = function(player, isConnected) {
		var colour = this._getPlayerColour(player);
		var relevance = this._relevanceFromColour(colour);
		
		this._template.set("players." + relevance + ".isConnected", isConnected);
	}
	
	GamePage.prototype._checkForPendingPremove = function() {
		this._game.getPendingPremove().then((function(premove) {
			if(premove !== null) {
				this._setPremove(premove);
			}
		}).bind(this));
	}
	
	GamePage.prototype._setPremove = function(premove) {
		this._board.setBoardArray(premove.board);
		this._board.highlightSquares(premove.from, Board.highlightTypes.PREMOVE_FROM);
		this._board.highlightSquares(premove.to, Board.highlightTypes.PREMOVE_TO);
		this._pendingPremove = premove;
	}
	
	GamePage.prototype._clearPremove = function() {
		this._board.setBoardArray(this._game.position.board);
		this._board.unhighlightSquares(Board.highlightTypes.PREMOVE_FROM, Board.highlightTypes.PREMOVE_TO);
		this._pendingPremove = null;
	}
	
	GamePage.prototype._cancelPremove = function() {
		this._game.cancelPremove();
		this._clearPremove();
	}
	
	GamePage.prototype._setupBoard = function() {
		this._board = new Board(this._template.nodes.board);
		
		this._board.SelectPiece.addHandler(function(data) {
			if(!this.userIsPlaying() || data.piece.colour !== this.getUserColour() || !this._game.isInProgress) {
				data.cancel = true;
			}
		}, this);
		
		this._board.PieceSelected.addHandler(function(data) {
			if(!data.isDragging) {
				this._board.highlightSquares(data.square, Board.highlightTypes.SELECTED);
			}
		}, this);
		
		this._board.Deselected.addHandler(function() {
			this._board.unhighlightSquares(Board.highlightTypes.SELECTED);
		}, this);
		
		this._board.Move.addHandler(function(moveEvent) {
			var allowPremove = this._user.getPrefs().premove;
			var userIsActive = this.userIsActivePlayer();
			var promoteTo = (this._user.getPrefs().alwaysQueen ? PieceType.queen : moveEvent.promoteTo);
			
			if(userIsActive || allowPremove) {
				if(
					promoteTo === null
					&& (
						userIsActive ?
						new Move(this._game.position, moveEvent.from, moveEvent.to).isPromotion :
						(moveEvent.piece.type === PieceType.pawn && moveEvent.to.isPromotionRank)
					)
				) {
					moveEvent.promptForPromotionPiece();
				}
				
				else {
					if(userIsActive) {
						this._game.move(moveEvent.from, moveEvent.to, promoteTo);
					}
					
					else if(this._pendingPremove === null) {
						var premove = this._game.premove(moveEvent.from, moveEvent.to, moveEvent.promoteTo);
						
						if(premove.isValid) {
							this._setPremove(premove);
						}
					}
				}
			}
		}, this);
		
		this._template.on("cancel_premove", (function(event) {
			event.original.preventDefault();
			
			this._cancelPremove();
		}).bind(this));
		
		this._updateBoard();
		this._setBoardPrefs();
	}
	
	GamePage.prototype._setBoardPrefs = function() {
		var prefs = this._user.getPrefs();
		
		if(prefs.boardStyle) {
			this._board.setSquareStyle(prefs.boardStyle);
		}
		
		if(prefs.pieceStyle) {
			this._board.setPieceStyle(prefs.pieceStyle);
		}
		
		if(prefs.boardSize) {
			this._board.setSquareSize(prefs.boardSize);
		}
		
		if(prefs.sound !== null) {
			this._board.toggleMoveSound(!!prefs.sound);
		}
	}
	
	GamePage.prototype._highlightMove = function(move) {
		this._board.unhighlightSquares(Board.highlightTypes.LAST_MOVE_FROM, Board.highlightTypes.LAST_MOVE_TO);
		this._board.highlightSquares(move.from, Board.highlightTypes.LAST_MOVE_FROM);
		this._board.highlightSquares(move.to, Board.highlightTypes.LAST_MOVE_TO);
	}
	
	GamePage.prototype._setupGameControls = function() {
		this._template.on("resign", (function() {
			this._game.resign();
		}).bind(this));
		
		this._template.on("offer_or_accept_draw", (function() {
			if(this.userIsActivePlayer()) {
				this._game.acceptDraw();
			}
			
			else {
				this._game.offerDraw();
			}
		}).bind(this));
		
		this._template.on("claim_draw", (function() {
			this._game.claimDraw();
		}).bind(this));
		
		this._template.on("rematch", (function() {
			if(this._game.rematchOfferedBy !== this.getUserColour()) {
				this._game.offerOrAcceptRematch();
			}
		}).bind(this));
		
		this._template.on("decline_rematch", (function() {
			if(this._game.rematchOfferedBy === this.getUserColour().opposite) {
				this._game.declineRematch();
			}
		}).bind(this));
		
		this._template.on("cancel_rematch", (function() {
			if(this._game.rematchOfferedBy === this.getUserColour()) {
				this._game.cancelRematch();
			}
		}).bind(this));
		
		this._template.on("new_game", (function() {
			var lastOptions = this._user.getLastSeekOptions();
			var timingStyle = this.getTimingStyle();
			
			var options = {
				initialTime: timingStyle.initialTime,
				timeIncrement: timingStyle.increment,
				acceptRatingMin: "-100",
				acceptRatingMax: "+100"
			};
			
			if(lastOptions) {
				options.acceptRatingMin = lastOptions.acceptRatingMin;
				options.acceptRatingMax = lastOptions.acceptRatingMax;
			}
			
			this._user.seekGame(options);
		}).bind(this));
		
		this._template.on("cancel_new_game", (function() {
			this._user.cancelSeek();
		}).bind(this));
	}
	
	GamePage.prototype._setupPrefsPanel = function() {
		var boardSizes = objToArray(Board.sizes);
		var currentBoardSize = this._user.getPrefs().boardSize || Board.DEFAULT_SQUARE_SIZE;
		var currentBoardSizeIndex = boardSizes.indexOf(currentBoardSize);
		
		this._template.on("toggle", (function(event, pref) {
			this._user.updatePref(pref, this._template.nodes[pref].checked);
		}).bind(this));
		
		this._template.on("board_flip", (function() {
			this._viewingAsPreference = this._viewingAs.opposite;
			this._updateUserDependentElements();
		}).bind(this));
		
		this._template.on("board_size_down", (function() {
			if(currentBoardSizeIndex > 0) {
				currentBoardSize = boardSizes[--currentBoardSizeIndex];
				
				this._user.updatePrefs({
					boardSize: currentBoardSize
				});
			}
		}).bind(this));
		
		this._template.on("board_size_up", (function() {
			if(currentBoardSizeIndex < boardSizes.length - 1) {
				currentBoardSize = boardSizes[++currentBoardSizeIndex];
				
				this._user.updatePrefs({
					boardSize: currentBoardSize
				});
			}
		}).bind(this));
	}
	
	GamePage.prototype._updateNewSeek = function() {
		var seek = this._user.getCurrentSeek();
		var timingStyle = this.getTimingStyle();
		
		if(
			seek !== null
			&& seek.options.initialTime === timingStyle.initialTime
			&& seek.options.timeIncrement === timingStyle.increment
		) {
			var expiryTime = seek.expiryTime;
			var timeLeft = expiryTime - this._server.getServerTime();
			var timeElapsed = jsonChessConstants.SEEK_TIMEOUT - timeLeft;
			var percentExpired = timeElapsed / (jsonChessConstants.SEEK_TIMEOUT / 100);
			
			this._template.set("newSeekWaiting", true);
			this._template.set("newSeekPercentExpired", percentExpired);
			
			this._newSeekTimeoutAnimation = this._template.animate("newSeekPercentExpired", 100, {
				duration: timeLeft
			});
		}
		
		else {
			this._template.set("newSeekWaiting", false);
		}
	}
	
	GamePage.prototype._setupHistory = function() {
		this._history = new History(this._template.nodes.history);
		
		this._updateHistory();
		
		this._history.UserSelect.addHandler(function(move) {
			this._board.setBoardArray(move.positionAfter.board);
		}, this);
	}
	
	GamePage.prototype._updateHistory = function() {
		this._history.clear();
		
		this._game.history.forEach((function(move) {
			this._history.move(move);
		}).bind(this));
		
		this._history.select(this._game.getLastMove());
	}
	
	GamePage.prototype._clearCapturedPieces = function() {
		for(var relevance in viewRelevance) {
			this._template.set("capturedPieces." + relevance + ".pawns", []);
			this._template.set("capturedPieces." + relevance + ".pieces", []);
		}
	}
	
	GamePage.prototype._populateCapturedPieces = function() {
		this._game.history.forEach(function(move) {
			if(move.capturedPiece) {
				this._addCapturedPiece(move.capturedPiece);
			}
		}, this);
	}
	
	GamePage.prototype._updateCapturedPieces = function() {
		this._clearCapturedPieces();
		this._populateCapturedPieces();
	}
	
	GamePage.prototype._addCapturedPiece = function(piece) {
		this._template.get("capturedPieces")[
			this._relevanceFromColour(piece.colour)
		][
			(piece.type === PieceType.pawn ? "pawns" : "pieces")
		].push(piece);
	}
	
	GamePage.prototype._updateBoard = function() {
		this._board.unhighlightSquares();
		this._board.setBoardArray(this._game.position.board);
		
		var lastMove = this._game.getLastMove();
		
		if(lastMove) {
			this._highlightMove(lastMove);
		}
	}
	
	GamePage.prototype._updateScores = function() {
		var result = this._game.result;
		
		if(result) {
			Colour.forEach((function(colour) {
				this._template.set("players." + this._relevanceFromColour(colour) + ".score", result.scores[colour]);
			}).bind(this));
		}
	}
	
	GamePage.prototype._setupTemplate = function(parent) {
		var timeCriticalThreshold = Time.fromUnitString("10s");
		
		this._template = new RactiveI18n({
			el: parent,
			template: html,
			data: {
				locale: this._user.getLocaleDictionary(),
				userPlayerId: this._user.getPlayerId(),
				prefs: this._user.getPrefs(),
				capturedPieceSize: CAPTURED_PIECE_SIZE,
				capturedPieceSprite: require.toUrl("../piece_sprites/Classic/" + CAPTURED_PIECE_SIZE + ".png"),
				capturedPieces: {},
				getPieceOffset: function(piece) {
					return -"PNBRQKpnbrqk".indexOf(piece) * CAPTURED_PIECE_SIZE;
				},
				timeCriticalThreshold: timeCriticalThreshold,
				newSeekWaiting: false,
				getColonDisplay: function(time) {
					return Time.fromMilliseconds(time).getColonDisplay(time < timeCriticalThreshold);
				},
				getAbsolutePath: function(path) {
					return require.toUrl(path);
				}
			},
			partials: {
				controls: controlsHtml
			}
		});
		
		for(var relevance in viewRelevance) {
			this._template.set("capturedPieces." + relevance, {
				pawns: [],
				pieces: []
			});
		}
	}
	
	GamePage.prototype._populateTemplate = function() {
		this._template.set({
			players: {
				player: {
					isConnected: true
				},
				opponent: {
					isConnected: true
				}
			},
			result: this._game.result,
			isInProgress: this._game.isInProgress,
			userIsPlaying: this.userIsPlaying(),
			viewingActivePlayer: (this._game.position.activeColour === this._viewingAs),
			userIsActivePlayer: this.userIsActivePlayer(),
			drawOffered: this._game.isDrawOffered,
			canClaimDraw: this._game.isDrawClaimable(),
			timingDescription: this._game.timingStyle.getDescription()
		});
		
		if(this.userIsPlaying()) {
			this._updateRematchOffer();
		}
		
		this._updateCapturedPieces();
		this._updateScores();
		this._updateClocks();
	}
	
	GamePage.prototype._updateRematchOffer = function() {
		var rematchOfferedBy = this._game.rematchOfferedBy;
		var colour = this.getUserColour();
		
		this._template.set({
			playerHasOfferedRematch: (rematchOfferedBy === colour),
			opponentHasOfferedRematch: (rematchOfferedBy === colour.opposite)
		});
	}
	
	GamePage.prototype.userIsActivePlayer = function() {
		return (this.getUserColour() === this._game.position.activeColour);
	}
	
	GamePage.prototype._setupChat = function() {
		this._chat = new Chat(this._user, this._game, this._template.nodes.chat);
	}
	
	GamePage.prototype._relevanceFromColour = function(colour) {
		return (colour === this._viewingAs ? viewRelevance.player : viewRelevance.opponent);
	}
	
	GamePage.prototype._updateUserDependentElements = function() {
		this._viewingAs = this._viewingAsPreference || this.getUserColour() || Colour.white;
		this._board.setViewingAs(this._viewingAs);
		this._updatePlayerInfo();
		this._updateScores();
		this._updateCapturedPieces();
		this._template.set("userIsPlaying", this.userIsPlaying());
		this._template.set("viewingActivePlayer", (this._game.position.activeColour === this._viewingAs));
	}
	
	GamePage.prototype._updatePlayerInfo = function() {
		Colour.forEach((function(colour) {
			this._template.set("players." + this._relevanceFromColour(colour), this._game.getPlayer(colour));
		}).bind(this));
	}
	
	GamePage.prototype._updateClocks = function() {
		Colour.forEach((function(colour) {
			this._template.set("players." + this._relevanceFromColour(colour) + ".time", this._game.getTimeLeft(colour));
		}).bind(this));
	}
	
	GamePage.prototype._startUpdatingClocks = function() {
		this._clockUpdateInterval = setInterval(this._updateClocks.bind(this), 100);
	}
	
	GamePage.prototype._stopUpdatingClocks = function() {
		if(this._clockUpdateInterval) {
			clearInterval(this._clockUpdateInterval);
			
			this._clockUpdateInterval = null;
		}
	}
	
	GamePage.prototype.show = function() {
		this._isVisible = true;
		this._startUpdatingClocks();
	}
	
	GamePage.prototype.hide = function() {
		this._stopUpdatingClocks();
		this._isVisible = false;
	}
	
	GamePage.prototype._handleUserEvents = function() {
		this._user.PrefsChanged.addHandler(function() {
			this._setBoardPrefs();
			this._template.set("prefs", this._user.getPrefs());
			
			if(!this._user.getPrefs().premove && this._pendingPremove) {
				this._cancelPremove();
			}
		}, this);
		
		this._user.LoggedIn.addHandler(function() {
			this._updateUserDependentElements();
			this._setBoardPrefs();
		}, this);
		
		this._user.LoggedOut.addHandler(function() {
			this._updateUserDependentElements();
			this._setBoardPrefs();
		}, this);
		
		this._user.SeekMatched.addHandler(function() {
			this._updateNewSeek();
		}, this);
		
		this._user.SeekCreated.addHandler(function() {
			this._updateNewSeek();
		}, this);
		
		this._user.SeekExpired.addHandler(function() {
			this._updateNewSeek();
			
			if(this._newSeekTimeoutAnimation) {
				this._newSeekTimeoutAnimation.stop();
				this._newSeekTimeoutAnimation = null;
			}
		}, this);
	}
	
	return GamePage;
});