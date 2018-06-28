define(function(require) {
	var id = require("js/id");
	
	function JsonLocalStorage(namespace) {
		this._namespace = namespace || id();
	}
	
	JsonLocalStorage.prototype.get = function(key) {
		var item = localStorage[this._namespace + key];
		
		if(item !== undefined) {
			item = JSON.parse(item);
		}
		
		return item;
	}
	
	JsonLocalStorage.prototype.set = function(key, item) {
		localStorage[this._namespace + key] = JSON.stringify(item);
	}
	
	return JsonLocalStorage;
});