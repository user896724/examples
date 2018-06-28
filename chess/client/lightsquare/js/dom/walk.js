define(function() {
	function walk(node, callback) {
		callback.call(node);
		walk.descendants(node, callback);
	}

	walk.children = function(node, callback) {
		node = node.firstElementChild;

		while(node) {
			callback.call(node);
			node = node.nextElementSibling;
		}
	}

	walk.descendants = function(node, callback) {
		node = node.firstElementChild;

		while(node) {
			walk(node, callback);
			node = node.nextElementSibling;
		}
	}

	return walk;
});