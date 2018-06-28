define(function(require) {
	require("ready!");
	var Server = require("websocket-client/Server");
	var JsonLocalStorage = require("json-local-storage/JsonLocalStorage");
	var User = require("./_User/User");
	var Lightsquare = require("./Lightsquare/Lightsquare");
	var create = require("dom/create");
	
	var locale = null;
	var queryStringLocale = document.location.href.match(/locale=(\w{2})/);
	
	if(queryStringLocale) {
		locale = queryStringLocale[1];
	}

	var db = new JsonLocalStorage("/lightsquare");
	var server = new Server("ws://" + window.location.hostname + ":50001");
	var user = new User(server, db, locale);
	var lightsquare = new Lightsquare(user, server, document.getElementById("main"));
});