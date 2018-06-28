define(function(require) {
	var Colour = require("./Colour");
	
	function Result(result, type) {
		this.winner = null;
		this.isDraw = (result === Result.DRAW);
		this.scores = {};
		this.type = type;
		this.description = Result.descriptions[this.type][this.isDraw ? "draw" : "win"];
		
		if(this.isDraw) {
			this.summary = "\u00bd-\u00bd";
			this.scores[Colour.white] = 0.5;
			this.scores[Colour.black] = 0.5;
		}
		
		else {
			var winner = result;
			
			this.winner = winner.fenString;
			this.isDraw = false;
			this.scores[winner] = 1;
			this.scores[winner.opposite] = 0;
			this.summary = this.scores[Colour.white] + "-" + this.scores[Colour.black];
			
			var replacements = {
				"winner": winner.name,
				"loser": winner.opposite.name
			};
			
			for(var placeholder in replacements) {
				this.description = this.description.replace(
					new RegExp("\\[" + placeholder + "\\]", "g"),
					replacements[placeholder]
				);
			}
		}
	}
	
	Result.prototype.toString = function() {
		return this.summary;
	}
	
	Result.DRAW = "draw";
	
	Result.types = {
		CHECKMATE: "checkmate",
		RESIGNATION: "resignation",
		FIFTYMOVE: "fifty move rule",
		THREEFOLD: "threefold",
		TIMEOUT: "timeout",
		INSUFFICIENT: "insufficient material",
		NO_MOVES: "stalemate",
		DRAW_AGREED: "draw agreed"
	};
	
	Result.descriptions = {};
	
	Result.descriptions[Result.types.CHECKMATE] = "[winner] won by checkmate";
	Result.descriptions[Result.types.RESIGNATION] = "[loser] resigned";
	Result.descriptions[Result.types.FIFTYMOVE] = "draw by fifty move rule";
	Result.descriptions[Result.types.THREEFOLD] = "draw by repetition";
	Result.descriptions[Result.types.INSUFFICIENT] = "insufficient mating material";
	Result.descriptions[Result.types.DRAW_AGREED] = "draw agreed";
	Result.descriptions[Result.types.NO_MOVES] = "stalemate";
	
	for(var type in Result.descriptions) {
		Result.descriptions[type] = {
			win: Result.descriptions[type],
			draw: Result.descriptions[type]
		};
	}
	
	Result.descriptions[Result.types.TIMEOUT] = {
		win: "[loser] forfeit on time",
		draw: "insufficient mating material"
	};
	
	return {
		win: function(colour, type) {
			return new Result(colour, type);
		},
		
		draw: function(type) {
			return new Result(Result.DRAW, type);
		},
		
		types: Result.types
	};
});