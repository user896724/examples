define(function(require, exports, module) {
	var test = require("chai").assert;
	var Position = require("../Position");
	var Square = require("../Square");
	var PieceType = require("../PieceType");
	var Piece = require("../Piece");
	var Colour = require("../Colour");
	var runTests = require("test-runner/runTests");
	require("./globalSquares");
	
	var tests = {
		"getReachableSquares for a white pawn on a2 is a3, a4, b3":
		
		function() {
			test.deepEqual(Position.getReachableSquares(PieceType.pawn, a2, Colour.white), [a4, a3, b3]);
		},
		
		"getReachableSquares for a knight on b1 is a3, c3, d2":
		
		function() {
			test.deepEqual(Position.getReachableSquares(PieceType.knight, b1, Colour.white), [a3, c3, d2]);
		},
		
		"getSquaresBetween c1 and a3 is [b2]":
		
		function() {
			test.deepEqual(Position.getSquaresBetween(c1, a3), [b2]);
		},
		
		"getSquaresBetween e2 and e5 is [e3, e4]":
		
		function() {
			test.deepEqual(Position.getSquaresBetween(e2, e5), [e3, e4]);
		},
		
		"getSquaresBetween a4 and h4 is [b4, c4, d4, e4, f4, g4]":
		
		function() {
			test.deepEqual(Position.getSquaresBetween(a4, h4), [b4, c4, d4, e4, f4, g4]);
		},
		
		"getSquaresBetween b6 and c8 is []":
		
		function() {
			test.deepEqual(Position.getSquaresBetween(b6, c8), []);
		},
		
		"rook moves jumping over pawns in start position are blocked":
		
		function(position) {
			test.equal(position.moveIsBlocked(a1, a3), true);
			test.equal(position.moveIsBlocked(h1, h3), true);
			test.equal(position.moveIsBlocked(a8, a6), true);
			test.equal(position.moveIsBlocked(h8, h6), true);
		},
		
		"e2e4 is not blocked":
		
		function(position) {
			test.equal(position.moveIsBlocked(e2, e4), false);
		},
		
		"knight moves are not blocked":
		
		function(position) {
			test.equal(position.moveIsBlocked(b1, c3), false);
			test.equal(position.moveIsBlocked(b1, a3), false);
			test.equal(position.moveIsBlocked(g1, f3), false);
			test.equal(position.moveIsBlocked(g1, h3), false);
		},
		
		"getReachableSquares for a knight on e4 is [d2, d6, f2, f6, c5, c3, g5, g3]":
		
		function() {
			var squares = Position.getReachableSquares(PieceType.knight, e4, Colour.white);
			
			test.deepEqual(squares, [d2, d6, f2, f6, c5, c3, g5, g3]);
		},
		
		"getReachableSquares for a rook in the corner is correct":
		
		function() {
			var squares = Position.getReachableSquares(PieceType.rook, a1, Colour.white);
			
			test.deepEqual(squares, [b1, a2, c1, a3, d1, a4, e1, a5, f1, a6, g1, a7, h1, a8]);
		},
		
		"getReachableSquares for a rook in the middle is correct":
		
		function() {
			var squares = Position.getReachableSquares(PieceType.rook, e4, Colour.white);
			
			test.deepEqual(squares, [a4, e1, b4, e2, c4, e3, d4, e5, f4, e6, g4, e7, h4, e8]);
		}
	};
	
	runTests(module.id, tests, function() {
		return [new Position()];
	});
});