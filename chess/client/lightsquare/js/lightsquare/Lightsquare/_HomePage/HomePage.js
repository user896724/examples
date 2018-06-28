define(function(require) {
	require("css!./home_page.css");
	var html = require("file!./home_page.html");
	var RactiveI18n = require("ractive-i18n/RactiveI18n");
	var SeekForm = require("./_SeekForm/SeekForm");
	var SeekGraph = require("./_SeekGraph/SeekGraph");
	var jsonchessMessageTypes = require("jsonchess/chatMessageTypes");
	var ListFeed = require("lightsquare/ListFeed");
	
	function HomePage(user, server, parent) {
		this._user = user;
		this._server = server;
		this._seekList = new ListFeed(this._server, "seeks");
		this._setupTemplate(parent);
	}
	
	HomePage.prototype._setupTemplate = function(parent) {
		this._template = new RactiveI18n({
			el: parent,
			template: html
		});
		
		new SeekForm(this._user, this._server, this._template.nodes.create_seek);
		new SeekGraph(this._seekList, this._user, this._template.nodes.seek_graph);
	}
	
	HomePage.prototype.show = function() {
		this._seekList.startUpdating();
	}
	
	HomePage.prototype.hide = function() {
		this._seekList.stopUpdating();
	}
	
	return HomePage;
});