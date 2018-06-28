define(function(require, exports, module) {
	var runTests = require("test-runner/runTests");
	var test = require("chai").assert;
	var getEpPawn = require("../getEpPawn");
	require("./globalSquares");
	
	var tests = {
		"en passant pawn is on e4 for an en passant capture from d4 to e3":
		
		function() {
			test.equal(getEpPawn(d4, e3), e4);
		},
		
		"en passant pawn is on b5 for an en passant capture from a5 to b6":
		
		function() {
			test.equal(getEpPawn(a5, b6), b5);
		}
	};
	
	runTests(module.id, tests);
});