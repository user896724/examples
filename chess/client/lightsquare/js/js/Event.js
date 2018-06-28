define(function(require) {
	require("Array.prototype/remove");
	require("Array.prototype/contains");
	
	function EventHandler(event, callback, bindTo) {
		this._bindTo = bindTo || this;
		this._event = event;
		this._callback = callback;
	}
	
	EventHandler.prototype.remove = function() {
		this._event.removeEventHandler(this);
	}
	
	EventHandler.prototype.add = function() {
		this._event.addEventHandler(this);
	}

	EventHandler.prototype.execute = function(data) {
		return this._callback.call(this._bindTo, data);
	}

	function Event() {
		this._handlers = [];
		this._isFiring = false;
		this._tempHandlers = [];
	}

	Event.prototype.fire = function(data) {
		this._isFiring = true;
		
		this._handlers = this._handlers.filter(function(handler) {
			return (handler.execute(data) !== true);
		}).concat(this._tempHandlers);
		
		this._isFiring = false;
		this._tempHandlers = [];

		return data;
	}

	Event.prototype.addHandler = function(callback, bindTo) {
		return this.addEventHandler(new EventHandler(this, callback, bindTo));
	}
	
	Event.prototype.addEventHandler = function(handler) {
		if(!this._handlers.contains(handler)) {
			if(this._isFiring) {
				this._tempHandlers.push(handler);
			}
		
			else {
				this._handlers.push(handler);
			}
		}
		
		return handler;
	}
	
	Event.prototype.removeEventHandler = function(handler) {
		this._handlers.remove(handler);
	}

	return Event;
});