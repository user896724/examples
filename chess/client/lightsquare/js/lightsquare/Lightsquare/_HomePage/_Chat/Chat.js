define(function(require) {
	require("css!./chat.css");
	var html = require("file!./chat.html");
	var RactiveI18n = require("ractive-i18n/RactiveI18n");
	var jsonchessMessageTypes = require("jsonchess/chatMessageTypes");
	
	var messageClasses = {};
	
	messageClasses[jsonchessMessageTypes.ADMIN] = "admin";
	messageClasses[jsonchessMessageTypes.USER] = "user";
	
	function Chat(user, server, parent) {
		this._server = server;
		
		this._template = new RactiveI18n({
			el: parent,
			template: html,
			data: {
				locale: user.getLocaleDictionary(),
				message: "",
				messages: [],
				getMessageClass: function(jsonchessMessageType) {
					return "message_type_" + messageClasses[jsonchessMessageType];
				}
			}
		});
		
		this._scrollOnNewMessages = true;
		this._historyNode = this._template.nodes.history;
		
		this._historyNode.addEventListener("scroll", (function() {
			this._scrollOnNewMessages = (this._historyNode.scrollHeight - this._historyNode.scrollTop === this._historyNode.clientHeight);
		}).bind(this));
		
		this._template.on("send", (function(event) {
			event.original.preventDefault();
			
			this._server.send("/chat", (this._template.get("message") || "").toString());
			this._template.set("message", "");
		}).bind(this));
		
		this._server.subscribe("/chat", (function(message) {
			this.addMessage(message);
		}).bind(this));
	}
	
	Chat.prototype.addMessage = function(message) {
		this._template.get("messages").push(message);
			
		if(this._scrollOnNewMessages) {
			this._historyNode.scrollTop = this._historyNode.scrollHeight;
		}
	}
	
	return Chat;
});