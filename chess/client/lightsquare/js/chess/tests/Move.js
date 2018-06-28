define(function(require, exports, module) {
	var test = require("chai").assert;
	var Move = require("../Move");
	var Fen = require("../Fen");
	var runTests = require("test-runner/runTests");
	require("./globalSquares");
	
	var tests = {
		"disambiguation: rook on a1, rook on a3 - a1-a2 - label is R1a2":
		
		function() {
			var position = Fen.getPosition("5k1K/8/8/8/8/R7/8/R7 w - - 1 0");
			var move = new Move(position, a1, a2);
			
			move.generateLabels();
			
			test.equal(move.label, "R1a2");
		},
		
		"disambiguation: knights on b2, b4 and f4 - b2-d3 - label is N2d3":
		
		function() {
			var position = Fen.getPosition("8/8/8/8/1N3N2/8/1N6/1K1k4 w - - 1 0");
			var move = new Move(position, b2, d3);
			
			move.generateLabels();
			
			test.equal(move.label, "N2d3");
		},
		
		"disambiguation: knights on b2, b4 and f2 - b2-d3 - label is Nb2d3":
		
		function() {
			var position = Fen.getPosition("k7/8/8/8/1N6/8/1N3N2/K7 w - - 1 0");
			var move = new Move(position, b2, d3);
			
			move.generateLabels();
			
			test.equal(move.label, "Nb2d3");
		}
	};
	
	runTests(module.id, tests);
});