define(function(require) {
	require("Array.prototype/remove");
	
	function Publisher(messageOriginator) {
		this._messageOriginator = messageOriginator;
		this._callbacks = {};
	}
	
	Publisher.prototype.subscribe = function(topic, callback) {
		if(!(topic in this._callbacks)) {
			this._callbacks[topic] = [];
		}
		
		this._callbacks[topic].push(callback);
	}
	
	Publisher.prototype.unsubscribe = function(topic, callback) {
		if(topic in this._callbacks) {
			this._callbacks[topic].remove(callback);
			
			if(this._callbacks[topic].length === 0) {
				delete this._callbacks[topic];
			}
		}
	}
	
	Publisher.prototype.publish = function(topic, data, originator) {
		originator = originator || this._messageOriginator;
		
		if(topic in this._callbacks) {
			this._callbacks[topic].forEach(function(callback) {
				callback(data, originator);
			});
		}
			
		if("*" in this._callbacks) {
			this._callbacks["*"].forEach(function(callback) {
				callback(topic, data, originator);
			});
		}
	}
	
	return Publisher;
});