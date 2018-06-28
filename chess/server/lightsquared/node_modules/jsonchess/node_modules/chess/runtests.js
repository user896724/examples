#!/usr/bin/js

var requirejs = require("requirejs");
var fs = require("fs");

requirejs.config({
	nodeRequire: require
});

require("amdefine/intercept");

requirejs([
	"./tests/Position",
	"./tests/Time",
	"./tests/Game",
	"./tests/Move",
	"./tests/Square",
	"./tests/getEpPawn"
]);