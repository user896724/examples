define(function(require) {
	var Event = require("js/Event");
	var Piece = require("chess/Piece");
	
	function RandomGames(server) {
		this._server = server;
		
		this.Update = new Event();
		this.GameOver = new Event();
		
		this._subscribeToServerMessages();
	}
	
	RandomGames.prototype.startUpdating = function() {
		this._server.getConnection().then((function() {
			this._server.send("/feed/activate", "/random_games");
		}).bind(this));
	}
	
	RandomGames.prototype.stopUpdating = function() {
		this._server.send("/feed/deactivate", "/random_games");
	}
	
	RandomGames.prototype._subscribeToServerMessages = function() {
		this._server.subscribe("/random_game", (function(gameDetails) {
			gameDetails.boardArray = gameDetails.board.split("").map(function(piece) {
				return (piece === " " ? null : Piece.byFenString[piece]);
			});
			
			this.Update.fire(gameDetails);
		}).bind(this));
		
		this._server.subscribe("/random_game/game_over", (function(id) {
			this.GameOver.fire(id);
		}).bind(this));
	}
	
	return RandomGames;
});