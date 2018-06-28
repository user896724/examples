define(function(require) {
	var merge = require("js/merge");
	var Event = require("js/Event");
	var Game = require("./Game");
	
	function Tournament(user, server, details) {
		merge(this, details);
		
		this.PlayerJoined = new Event();
		this.PlayerLeft = new Event();
		this.Started = new Event();
		this.Canceled = new Event();
		this.Finished = new Event();
		this.GameStarted = new Event();
		this.PlayerEliminated = new Event();
		
		this.players = [];
		this.currentPlayers = [];
		
		this._user = user;
		this._server = server;
		this._subscribeToServerMessages();
	}
	
	/*
	For now, the winner will know they are the winner because they are still in
	the tournament when it finishes.
	
	Later on we can start passing the details of the final standings with the
	/finished message.
	*/
	
	Tournament.prototype._subscribeToServerMessages = function() {
		var subscriptions = {
			"/game": function(gameDetails) {
				var game = new Game(this._user, this._server, gameDetails);
				
				this._addGame(game);
				
				game.GameOver.addHandler(function(result) {
					
				}, this);
				
				this.GameStarted.fire(game);
			},
			
			"/finished": function() {
				this.Finished.fire();
			},
			
			"/player_eliminated": function(player) {
				this._removePlayer(player);
				this.PlayerEliminated.fire(player);
			},
			
			"/started": function() {
				this.Started.fire();
			},
			
			"/canceled": function() {
				this._cancel();
			},
			
			"/player_joined": function(player) {
				this._addPlayer(player);
				this.PlayerJoined.fire(player);
			},
			
			"/player_left": function(player) {
				this._removePlayer(player);
				this.PlayerLeft.fire(player);
			}
		}
			
		for(var topic in subscriptions) {
			this._server.subscribe("/tournament/" + this.id + topic, subscriptions[topic].bind(this));
		}
	}
	
	return Tournament;
});