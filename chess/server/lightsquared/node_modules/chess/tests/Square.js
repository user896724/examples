define(function(require, exports, module) {
	var test = require("chai").assert;
	var runTests = require("test-runner/runTests");
	var Square = require("../Square");
	require("./globalSquares");
	
	var tests = {
		"h1 is a light square":
		
		function() {
			test.equal(h1.colour, Square.colours.LIGHT);
		}
	};
	
	runTests(module.id, tests);
});