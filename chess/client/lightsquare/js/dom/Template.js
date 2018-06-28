define(function(require) {
	require("ready!");
	var walk = require("./walk");
	var create = require("./create");

	function Template(html, parent) {
		var self = this;
		var tempContainer = create("div", document.body);
		
		tempContainer.style.display = "none";
		tempContainer.innerHTML = html;

		var node = tempContainer.firstElementChild.cloneNode(true);

		if(parent) {
			parent.appendChild(node);
		}

		walk(node, function() {
			var data_id = this.getAttribute("data-id");

			if(data_id) {
				self[data_id] = this;
			}
		});
		
		document.body.removeChild(tempContainer);
	}

	return Template;
});