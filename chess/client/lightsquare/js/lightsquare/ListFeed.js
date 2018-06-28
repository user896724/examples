define(function(require) {
	var Event = require("js/Event");
	
	function List(server, listName) {
		this._server = server;
		this._listName = listName;
		this._list = [];
		this._isUpdating = false;
		
		this.Updated = new Event();
		
		this._server.subscribe("/list/" + this._listName + "/add", (function(item) {
			this._list.push(item);
			this.Updated.fire();
		}).bind(this));
		
		this._server.subscribe("/list/" + this._listName, (function(items) {
			this._list = items.slice();
			this.Updated.fire();
		}).bind(this));
		
		this._server.subscribe("/list/" + this._listName + "/remove", (function(id) {
			this._list = this._list.filter(function(item) {
				return (item.id !== id);
			});
			
			this.Updated.fire();
		}).bind(this));
	}
	
	List.prototype.getItems = function() {
		return this._list.slice();
	}
	
	List.prototype.startUpdating = function() {
		if(!this._isUpdating) {
			this._server.send("/feed/activate", "/list/" + this._listName);
			this._isUpdating = true;
		}
	}
	
	List.prototype.stopUpdating = function() {
		if(this._isUpdating) {
			this._list = [];
			this.Updated.fire();
			this._server.send("/feed/deactivate", "/list/" + this._listName);
			this._isUpdating = false;
		}
	}
	
	return List;
});