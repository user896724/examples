define(function(require, exports, module) {
	function create(tag, parent) {
		var el = document.createElement(tag);

		if(parent) {
			parent.appendChild(el);
		}

		return el;
	}

	return create;
});