define(function(require) {
	var objToArray = require("js/objToArray");
	var Event = require("js/Event");
	var Promisor = require("js/Promisor");
	var Move = require("jsonchess/Move");
	var Premove = require("jsonchess/Premove");
	var ChessGame = require("chess/Game");
	var Position = require("chess/Position");
	var Colour = require("chess/Colour");
	var ChessMove = require("chess/Move");
	var Square = require("chess/Square");
	var PieceType = require("chess/PieceType");
	var TimingStyle = require("chess/TimingStyle");
	var Clock = require("chess/Clock");

	function Game(user, server, gameDetails) {
		this._promisor = new Promisor(this);
		
		this.Move = new Event();
		this.ClockTick = new Event();
		this.GameOver = new Event();
		this.Aborted = new Event();
		this.DrawOffered = new Event();
		this.ChatMessageReceived = new Event();
		this.RematchOffered = new Event();
		this.RematchDeclined = new Event();
		this.RematchOfferCanceled = new Event();
		this.RematchOfferExpired = new Event();
		this.Rematch = new Event();
		
		this._user = user;
		this._server = server;
		
		this._options = gameDetails.options;
		this.startTime = gameDetails.startTime;
		this.endTime = gameDetails.endTime;
		this.id = gameDetails.id;
		this.isInProgress = gameDetails.isInProgress;
		this.result = gameDetails.result;
		this.isDrawOffered = gameDetails.isDrawOffered;
		this.isUndoRequested = gameDetails.isUndoRequested;
		this._addedTime = gameDetails.addedTime;
		
		this.rematchOfferedBy = (
			gameDetails.rematchOfferedBy ?
			Colour.byFenString[gameDetails.rematchOfferedBy] :
			null
		);
		
		this._players = {};
		this._players[Colour.white] = gameDetails.white;
		this._players[Colour.black] = gameDetails.black;
		
		this.position = new Position();
		this.history = [];
		this._moveQueue = [];
		
		for(var i = 0; i < gameDetails.history.length; i++) {
			this._handleServerMove(gameDetails.history[i]);
		}
		
		this.timingStyle = new TimingStyle({
			initialTime: this._options.initialTime,
			increment: this._options.timeIncrement
		});
		
		this.Move.addHandler(function() {
			this._promisor.resolve("/request/premove", null);
		}, this);
		
		this._clock = new Clock(this, this.timingStyle, function() {
			return server.getServerTime();
		});
		
		for(var colour in this._addedTime) {
			this._clock.addTime(this._addedTime[colour], colour);
		}
		
		if(this.isInProgress) {
			this._requestLatestMoves();
		}
		
		this._subscribeToServerMessages();
	}
	
	Game.prototype._subscribeToServerMessages = function() {
		var subscriptions = {
			"/move": function(move) {
				this._handleServerMove(move);
			},
			
			"/chat": function(message) {
				this.ChatMessageReceived.fire({
					from: message.from,
					body: message.body
				});
			},
			
			"/game_over": function(result) {
				this._gameOver(result);
			},
			
			"/aborted": function() {
				this._abort();
			},
			
			"/draw_offer": function(colour) {
				if(Colour.byFenString[colour] === this.position.activeColour.opposite) {
					this.DrawOffered.fire();
				}
			},
			
			"/rematch/offered": function(colour) {
				var offeredBy = Colour.byFenString[colour];
				
				this.rematchOfferedBy = offeredBy;
				this.RematchOffered.fire(offeredBy);
			},
			
			"/rematch/declined": function() {
				var colour = this.rematchOfferedBy;
				
				this.rematchOfferedBy = null;
				this.RematchDeclined.fire(colour.opposite);
			},
			
			"/rematch/canceled": function() {
				var colour = this.rematchOfferedBy;
				
				this.rematchOfferedBy = null;
				this.RematchOfferCanceled.fire(colour);
			},
			
			"/rematch/expired": function() {
				this.rematchOfferedBy = null;
				this.RematchOfferExpired.fire();
			},
			
			"/rematch": function(gameDetails) {
				this._rematch(gameDetails);
			},
			
			"/premove": function(data) {
				var premove = null;
				
				if(data !== null) {
					var promoteTo = (data.promoteTo ? PieceType.bySanString[data.promoteTo] : PieceType.queen);
					var from = Square.bySquareNo[data.from];
					var to = Square.bySquareNo[data.to];
					
					premove = new Premove(this.position, from, to, promoteTo);
				}
				
				this._promisor.resolve("/request/premove", premove);
			}
		};
		
		for(var topic in subscriptions) {
			this._server.subscribe("/game/" + this.id + topic, subscriptions[topic].bind(this));
		}
	}
	
	Game.prototype._requestLatestMoves = function() {
		this._server.send("/game/" + this.id + "/request/moves", this.history.length);
	}

	Game.prototype.move = function(from, to, promoteTo) {
		if(this.isInProgress) {
			var move = new ChessMove(this.position, from, to, promoteTo);
			
			if(move.isLegal) {
				move.generateLabels();
				
				this._addMove(move);
				
				this._server.send("/game/" + this.id + "/move", {
					from: from.squareNo,
					to: to.squareNo,
					promoteTo: (promoteTo ? promoteTo.sanString : undefined)
				});
				
				this.Move.fire(move);
			}
		}
	}
	
	Game.prototype.premove = function(from, to, promoteTo) {
		var premove = new Premove(this.position, from, to, promoteTo);
			
		if(premove.isValid) {
			this._server.send("/game/" + this.id + "/premove", premove);
		}
		
		return premove;
	}
	
	Game.prototype.cancelPremove = function() {
		this._server.send("/game/" + this.id + "/premove/cancel");
	}
	
	Game.prototype.getPendingPremove = function() {
		return this._promisor.get("/request/premove", function(promise) {
			if(this.isInProgress) {
				this._server.send("/game/" + this.id + "/request/premove");
			}
			
			else {
				promise.resolve(null);
			}
		});
	}
	
	Game.prototype.resign = function() {
		if(this.isInProgress) {
			this._server.send("/game/" + this.id + "/resign");
		}
	}
	
	Game.prototype.offerDraw = function() {
		if(this.isInProgress) {
			this._server.send("/game/" + this.id + "/offer_draw");
		}
	}
	
	Game.prototype.acceptDraw = function() {
		if(this.isInProgress) {
			this._server.send("/game/" + this.id + "/accept_draw");
		}
	}
	
	Game.prototype.claimDraw = function() {
		if(this.isInProgress && this.isDrawClaimable()) {
			this._server.send("/game/" + this.id + "/claim_draw");
		}
	}
	
	Game.prototype.offerOrAcceptRematch = function() {
		this._server.send("/game/" + this.id + "/rematch");
	}
	
	Game.prototype.declineRematch = function() {
		this._server.send("/game/" + this.id + "/rematch/decline");
	}
	
	Game.prototype.cancelRematch = function() {
		this._server.send("/game/" + this.id + "/rematch/cancel");
	}
	
	Game.prototype._rematch = function(gameDetails) {
		this.Rematch.fire(new Game(this._user, this._server, gameDetails));
	}
	
	Game.prototype.timingHasStarted = function() {
		return this._clock.timingHasStarted();
	}
	
	Game.prototype.getUserColour = function() {
		var userColour = null;
		
		Colour.forEach(function(colour) {
			if(this._user.getPlayerId() === this._players[colour].id) {
				userColour = colour;
			}
		}, this);
		
		return userColour;
	}
	
	Game.prototype.userIsPlaying = function() {
		return (this.getUserColour() !== null);
	}
	
	Game.prototype.getPlayerName = function(colour) {
		return this._players[colour].name;
	}
	
	Game.prototype.getPlayers = function() {
		return objToArray(this._players);
	}
	
	Game.prototype.getPlayer = function(colour) {
		return this._players[colour];
	}
	
	Game.prototype.getRating = function(colour) {
		return this._players[colour].rating;
	}
	
	Game.prototype.getActivePlayer = function() {
		return this._players[this.position.activeColour];
	}
	
	Game.prototype.getTimeLeft = function(colour) {
		return this._clock.getTimeLeft(colour);
	}
	
	Game.prototype.isDrawClaimable = function() {
		return (this.isFiftymoveClaimable() || this.isThreefoldClaimable());
	}
	
	Game.prototype.isFiftymoveClaimable = function() {
		return ChessGame.prototype.isFiftymoveClaimable.call(this);
	}
	
	Game.prototype.isThreefoldClaimable = function() {
		return ChessGame.prototype.isThreefoldClaimable.call(this);
	}
	
	Game.prototype.getLastMove = function() {
		return this.history[this.history.length - 1] || null;
	}
	
	Game.prototype.sendChatMessage = function(message) {
		this._server.send("/game/" + this.id + "/chat", message);
	}
	
	Game.prototype._handleServerMove = function(moveString) {
		var move = Move.unpack(moveString);
		
		if(move.index > this.history.length) {
			this._enqueueServerMove(move);
		}
		
		else if(move.index < this.history.length) {
			this._updateTimeFromServerMove(move);
		}
		
		else {
			this._applyServerMove(move);
		}
	}
	
	Game.prototype._enqueueServerMove = function(move) {
		this._moveQueue[move.index] = move;
	}
	
	Game.prototype._updateTimeFromServerMove = function(move) {
		this.history[move.index].time = move.time;
		this._clock.calculateTimes();
	}
	
	Game.prototype._applyServerMove = function(jsonchessMove) {
		var move = Move.decode(jsonchessMove, this.position);
		
		this._addMove(move);
		this.Move.fire(move);
		
		var next = this._moveQueue[move.index + 1];
		
		if(next) {
			this._applyServerMove(next);
		}
	}
	
	Game.prototype._addMove = function(move) {
		this.position = move.positionAfter.getCopy();
		this.history.push(move);
	}
		
	Game.prototype._abort = function() {
		this.isInProgress = false;
		this.Aborted.fire();
	}
	
	Game.prototype._gameOver = function(result) {
		this.isInProgress = false;
		this.result = result;
		this.GameOver.fire(result);
	}
	
	Game.prototype.getBackupDetails = function() {
		return {
			history: this.history.map(function(move) {
				return Move.encodeAndPack(move);
			}),
			startTime: this.startTime,
			options: this._options,
			addedTime: this._addedTime,
			id: this.id
		};
	}
	
	return Game;
});