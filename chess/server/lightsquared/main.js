#!/usr/bin/js

var requirejs = require("requirejs");
var mongodb = require("mongodb");

/*
amdefine/intercept - allows requirejs-style modules to be required
through Node's require.

NOTE this has to be after the Node require that requires requirejs,
because once loaded it tacks some code onto the beginning of all
node-required modules, checking whether the define function exists
and defining it if not, and this messes up the "r.js" module for
some reason.
*/

require("amdefine/intercept");

var Server = require("websocket-server/Server");
var Application = require("./Application");
var Bot = require("./Bot");
var config = require("./config");

requirejs.config({
	nodeRequire: require
});

mongodb.MongoClient.connect("mongodb://mongo:27017", function(error, client) {
	if(client) {
		var db = client.db("lightsquare");
		var server = new Server(config.port);
		var app = new Application(server, db);
		
		for(var i = 0; i < config.bots; i++) {
			new Bot(app);
		}
	}
	
	else {
		console.error("Cannot connect to mongodb");
		console.error(error);
		process.exit(1);
	}
});