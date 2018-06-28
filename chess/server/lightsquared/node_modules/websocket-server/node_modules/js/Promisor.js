define(function(require) {
	var Promise = require("./Promise");
	
	function Promisor(promisor) {
		this._promisor = promisor;
		this._promises = {};
	}
	
	Promisor.prototype.get = function(id, initialSetupCallback) {
		return this._get(id, initialSetupCallback, true);
	}
	
	Promisor.prototype.getPersistent = function(id, initialSetupCallback) {
		return this._get(id, initialSetupCallback, false);
	}
	
	Promisor.prototype._get = function(id, initialSetupCallback, removeOnFinish) {
		var promise;
		
		if(id in this._promises) {
			promise = this._promises[id];
		}
		
		else {
			promise = this._promises[id] = new Promise();
			
			if(initialSetupCallback) {
				initialSetupCallback.call(this._promisor, promise);
			}
			
			if(removeOnFinish) {
				promise.onFinish((function() {
					this.remove(id);
				}).bind(this));
			}
		}
		
		return promise;
	}
	
	Promisor.prototype.remove = function(id) {
		delete this._promises[id];
	}
	
	Promisor.prototype.resolve = function(id) {
		var resolveArguments = Array.prototype.slice.call(arguments, 1);
		
		if(id in this._promises) {
			this._promises[id].resolve.apply(this._promises[id], resolveArguments);
		}
	}
	
	Promisor.prototype.progress = function(id) {
		var progressArguments = Array.prototype.slice.call(arguments, 1);
		
		if(id in this._promises) {
			this._promises[id].progress.apply(this._promises[id], progressArguments);
		}
	}
	
	Promisor.prototype.fail = function(id) {
		var failArguments = Array.prototype.slice.call(arguments, 1);
		
		if(id in this._promises) {
			this._promises[id].fail.apply(this._promises[id], failArguments);
		}
	}
	
	return Promisor;
});