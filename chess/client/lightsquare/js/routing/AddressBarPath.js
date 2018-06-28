define(function(require) {
	var Event = require("js/Event");
	
	function AddressBarPath() {
		this._path = window.location.pathname;
		this.Changed = new Event();
		
		window.addEventListener("popstate", (function() {
			this._path = window.location.pathname;
			this.Changed.fire(this._path);
		}).bind(this));
	}
	
	AddressBarPath.prototype.set = function(path) {
		window.history.pushState(null, null, path);
		
		this._path = path;
		this.Changed.fire(path);
	}
	
	AddressBarPath.prototype.get = function() {
		return this._path;
	}
	
	return AddressBarPath;
});