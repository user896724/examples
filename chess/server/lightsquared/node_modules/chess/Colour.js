define(function(require) {
	function Colour(fenString) {
		this.fenString = fenString;
		
		this.name = ({
			"w": "white",
			"b": "black"
		})[fenString];
	}
	
	Colour.prototype.toString = function() {
		return this.fenString;
	}
	
	Colour.prototype.toJSON = function() {
		return this.fenString;
	}
	
	var white = new Colour("w");
	var black = new Colour("b");
	
	white.opposite = black;
	black.opposite = white;
	
	var colours = [white, black];
	
	colours["w"] = white;
	colours["b"] = black;

	return {
		white: white,
		black: black,
		
		byFenString: colours,
		
		forEach: function() {
			colours.forEach.apply(colours, arguments);
		},
		
		map: function() {
			return colours.map.apply(colours, arguments);
		}
	};
});