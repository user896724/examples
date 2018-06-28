define (require, exports, module) ->
	require! {
		chai: { assert }
		"../Fen"
		"../Game"
		"../Square"
		"../PieceType"
		"../Piece"
		"../Colour"
		"test-runner/runTests"
		"./globalSquares"
	}
	
	tests =
		"suspicious game": (game) ->
			game.position = Fen.getPosition "1rqrb1k1/1pp1bpp1/p3pn1p/4N3/3npPB1/P1N1Q2P/1PPB2P1/2R1R1K1 b - - 0 0"
			
			assert.equal game.position.activeColour.fenString, Colour.black.fenString
			
			game.move e7, c5
			
			assert.equal game.position.activeColour.fenString, Colour.white.fenString
			
			moves = []
			originalPos = game.position.getCopy!
			
			Square.forEach (sq) ->
				game.position.getLegalMovesFromSquare sq .forEach (toSq) ->
					moves.push [sq, toSq]
			
			moves.forEach (move) ->
				game.move move.0, move.1
				assert.equal game.position.activeColour.fenString, "b"
				game.position = originalPos.getCopy!
	
	runTests module.id, tests, ->
		[new Game isTimed: false]
