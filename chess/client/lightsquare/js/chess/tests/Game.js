define(function(require, exports, module) {
	var test = require("chai").assert;
	var Game = require("../Game");
	var Square = require("../Square");
	var PieceType = require("../PieceType");
	var Piece = require("../Piece");
	var Colour = require("../Colour");
	var runTests = require("test-runner/runTests");
	require("./globalSquares");
	
	var tests = {
		"white can move from d2 to d4 at the beginning of a standard game":
		
		function(game) {
			game.move(d2, d4);
			
			test.strictEqual(game.position.board[d2.squareNo], null);
			test.strictEqual(game.position.board[d4.squareNo], Piece.pieces[PieceType.pawn][Colour.white]);
		},
		
		"ep target is d3; fiftymoveClock is 0 and activeColour is black after 1. d4":
		
		function(game) {
			game.move(d2, d4);
			
			test.strictEqual(game.position.activeColour, Colour.black);
			test.strictEqual(game.position.fiftymoveClock, 0);
			test.strictEqual(game.position.epTarget, d3);
		},
		
		"e4, e5, Bc4, a6, Qf3, a5, Qxf7 is mate for black":
		
		function(game) {
			test.strictEqual(game.position.countLegalMoves(), 20);
			
			game.move(e2, e4);
			game.move(e7, e5);
			game.move(f1, c4);
			game.move(a7, a6);
			game.move(d1, f3);
			game.move(a6, a5);
			
			var move = game.move(f3, f7);
			
			move.checkCheckAndMate();
			
			test.strictEqual(move.isMate, true);
		},
		
		"threefold repetition after Nf3, Nc6, Ng1, Nb8, Nf3, Nc6, Ng1, Nb8":
		
		function(game) {
			game.move(g1, f3);
			game.move(b8, c6);
			game.move(f3, g1);
			game.move(c6, b8);
			game.move(g1, f3);
			game.move(b8, c6);
			game.move(f3, g1);
			game.move(c6, b8);
			game.move(g1, f3);
			game.move(b8, c6);
			
			test.strictEqual(game.isThreefoldClaimable(), true);
		}
	};
	
	runTests(module.id, tests, function() {
		return [new Game({
			isTimed: false
		})];
	});
});