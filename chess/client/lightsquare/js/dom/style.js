define(function(require) {
	function style(node, css) {
		var value;

		for(var prop in css) {
			value = css[prop];

			if((typeof value) === "number" && prop !== "zIndex" && prop !== "opacity") {
				value += "px";
			}

			node.style[prop] = value;
		}
	}

	return style;
});