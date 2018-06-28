define(function(require) {
	require("css!./chat.css");
	var html = require("file!./chat.html");
	var RactiveI18n = require("ractive-i18n/RactiveI18n");
	var Colour = require("chess/Colour");
	var jsonchess = require("jsonchess/constants");
	
	function Chat(user, game, parent) {
		this._user = user;
		
		this._template = new RactiveI18n({
			el: parent,
			template: html,
			data: {
				locale: this._user.getLocaleDictionary(),
				message: "",
				messages: []
			}
		});
		
		this._scrollOnNewMessages = true;
		this._historyNode = this._template.nodes.chat_history;
		
		this._historyNode.addEventListener("scroll", (function() {
			var node = this._historyNode;
			
			this._scrollOnNewMessages = (node.scrollHeight - node.scrollTop === node.clientHeight);
		}).bind(this));
		
		this._template.on("send", (function(event) {
			event.original.preventDefault();
			
			this._game.sendChatMessage((this._template.get("message") || "").toString());
			this._template.set("message", "");
		}).bind(this));
		
		this._setupGame(game);
	}
	
	Chat.prototype._setupGame = function(game) {
		this._game = game;
		
		this._addMessage(
			game.getPlayerName(Colour.white)
			+ " vs. " + game.getPlayerName(Colour.black) + " "
			+ game.timingStyle.getDescription()
		);
		
		this._game.ChatMessageReceived.addHandler(function(message) {
			this._addMessage(message.body, message.from);
		}, this);
		
		this._game.DrawOffered.addHandler(function() {
			this._addMessage(
				this._user.__("%s has offered a draw", [
					this._game.getPlayerName(this._game.position.activeColour.opposite)
				]) + "."
			);
		}, this);
		
		this._game.RematchOffered.addHandler(function(colour) {
			if(colour === this._game.getUserColour().opposite) {
				this._addMessage(
					this._user.__("%s has offered you a rematch", [
						this._game.getPlayerName(this._game.getUserColour().opposite)
					]) + "."
				);
			}
		}, this);
		
		this._game.RematchDeclined.addHandler(function(colour) {
			if(colour === this._game.getUserColour().opposite) {
				this._addMessage(this._user.__("%s has declined a rematch", [this._game.getPlayerName(colour)]) + ".");
			}
		}, this);
		
		this._game.Rematch.addHandler(function(game) {
			this._setupGame(game);
		}, this);
		
		this._game.GameOver.addHandler(function(result) {
			this._addMessage(this._user.__("Game over: " + result.description + "."));
		}, this);
		
		this._game.Aborted.addHandler(function() {
			this._addMessage(this._user.__(
				"Game aborted by the server - moves before timing starts must be made"
				+ " within %d seconds.", [jsonchess.TIME_FOR_MOVES_BEFORE_CLOCK_START / 1000]
			));
		}, this);
	}
	
	Chat.prototype._addMessage = function(body, from) {
		this._template.get("messages").push({
			from: from,
			body: body
		});
			
		if(this._scrollOnNewMessages) {
			this._historyNode.scrollTop = this._historyNode.scrollHeight;
		}
	}
	
	return Chat;
});