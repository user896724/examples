define(function(require) {
	var Event = require("js/Event");
	var Promise = require("js/Promise");
	var Game = require("./Game");
	
	function RestorationRequest(user, server, backup) {
		this._id = backup.gameDetails.id;
		this._user = user;
		this._server = server;
		this._backup = backup;
		this._promise = new Promise();
		this._handleServerMessages();
		
		this.GameRestored = new Event();
	}
	
	RestorationRequest.prototype.getId = function() {
		return this._id;
	}
	
	RestorationRequest.prototype._handleServerMessages = function() {
		this._server.subscribe("/game/restore/" + this._id + "/success", (function(gameDetails) {
			var game = new Game(this._user, this._server, gameDetails);
			
			this._promise.resolve(game);
			this.GameRestored.fire(game);
		}).bind(this));
		
		this._server.subscribe("/game/restore/" + this._id + "/pending", (function() {
			this._promise.progress();
		}).bind(this));
		
		this._server.subscribe("/game/restore/" + this._id + "/failure", (function(reason) {
			this._promise.fail(reason);
		}).bind(this));
	}
	
	RestorationRequest.prototype.submit = function() {
		this._server.send("/game/restore", {
			gameDetails: this._backup.gameDetails,
			playingAs: this._backup.playingAs
		});
		
		return this._promise;
	}
	
	RestorationRequest.prototype.then = function() {
		this._promise.then.apply(this._promise, arguments);
	}
	
	RestorationRequest.prototype.onProgress = function() {
		this._promise.onProgress.apply(this._promise, arguments);
	}
	
	RestorationRequest.prototype.cancel = function() {
		this._server.send("/game/restore/cancel", this._id);
	}
	
	return RestorationRequest;
});