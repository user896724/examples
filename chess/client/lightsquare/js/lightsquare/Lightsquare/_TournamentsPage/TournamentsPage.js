define(function(require) {
	require("css!./tournaments_page.css");
	var html = require("file!./tournaments_page.html");
	var RactiveI18n = require("ractive-i18n/RactiveI18n");
	var ListFeed = require("lightsquare/ListFeed");
	var Proxy = require("sup/adaptors/websocket-client");
	var List = require("sup/List");
	var ractiveAdaptor = require("sup/adaptors/ractive");
	
	var ESCAPE_KEY = 27;
	
	function TournamentsPage(user, server, parent) {
		this._formDefaults = {
			name: "",
			initialTime: "3m",
			timeIncrement: "2",
			playersInput: 3
		};
		
		this._user = user;
		this._server = server;
		this._proxy = new Proxy(this._server, "/tournaments");
		this._setupTemplate(parent);
	}
	
	TournamentsPage.prototype._init = function() {
		this._proxy.init(List, true).then((function(tournaments) {
			ractiveAdaptor(tournaments, this._template, "tournaments");
		}).bind(this));
	}
	
	TournamentsPage.prototype._teardown = function() {
		this._proxy.cancel();
		this._template.set("tournaments", []);
	}
	
	TournamentsPage.prototype._setupTemplate = function(parent) {
		this._template = new RactiveI18n({
			el: parent,
			template: html,
			data: {
				locale: this._user.getLocaleDictionary(),
				dialog: null,
				error: null,
				players: function(input) {
					return Math.pow(2, input);
				},
				tournaments: []
			}
		});
		
		this._template.set(this._formDefaults);
		
		this._template.on("open_create_dialog", (function() {
			this._showDialog("create");
		}).bind(this));
		
		this._template.on("create", (function(event, players) {
			event.original.preventDefault();
			
			this._user.createTournament({
				name: this._template.get("name"),
				playersRequired: players,
				initialTime: this._template.get("initialTime"),
				timeIncrement: this._template.get("timeIncrement")
			}).then((function(tournament) {
				this._template.set("tournamentCreated", true);
				
				setTimeout((function() {
					this._hideDialog();
					this._clearForm();
				}).bind(this), 1000);
			}).bind(this), (function(error) {
				this._setError(error);
			}).bind(this));
		}).bind(this));
		
		this._setupDialogHandlers();
	}
	
	TournamentsPage.prototype._clearForm = function() {
		this._template.set(this._formDefaults);
		
		this._template.set({
			tournamentCreated: false
		});
	}
	
	TournamentsPage.prototype._clearError = function() {
		this._template.set("error", "");
	}
	
	TournamentsPage.prototype._setError = function(message) {
		this._template.set("error", message);
	}
	
	TournamentsPage.prototype._setupDialogHandlers = function() {
		var foregroundClicked = false;
		
		this._template.on("background_click", (function() {
			if(!foregroundClicked) {
				this._hideDialog();
			}
			
			foregroundClicked = false;
		}).bind(this));
		
		this._template.on("foreground_click", (function() {
			foregroundClicked = true;
		}).bind(this));
		
		window.addEventListener("keyup", (function(event) {
			if(event.keyCode === ESCAPE_KEY) {
				this._hideDialog();
			}
		}).bind(this));
	}
	
	TournamentsPage.prototype._showDialog = function(dialog) {
		this._template.set("dialog", dialog);
	}
	
	TournamentsPage.prototype._hideDialog = function(dialog) {
		if(!dialog || this._template.get("dialog") === dialog) {
			this._template.set("dialog", null);
		}
	}
	
	TournamentsPage.prototype.show = function() {
		this._init();
	}
	
	TournamentsPage.prototype.hide = function() {
		this._teardown();
	}
	
	return TournamentsPage;
});