define(function(require) {
	function Promise() {
		this._isFinished = false;
		this._isResolved = false;
		this._hasFailed = false;
		
		this._resolveCallbacks = [];
		this._failCallbacks = [];
		this._progressCallbacks = [];
		this._finishCallbacks = [];
		
		this._resolveArguments = [];
		this._failArguments = [];
	}
	
	Promise.prototype.fail = function() {
		if(!this._isFinished) {
			var failArguments = arguments;
			
			this._failCallbacks.forEach(function(callback) {
				callback.apply(this, failArguments);
			});
			
			this._finish();
			this._failArguments = failArguments;
			this._hasFailed = true;
		}
	}
	
	Promise.prototype.resolve = function() {
		if(!this._isFinished) {
			var resolveArguments = arguments;
			
			this._resolveCallbacks.forEach(function(callback) {
				callback.apply(this, resolveArguments);
			});
			
			this._finish();
			this._resolveArguments = resolveArguments;
			this._isResolved = true;
		}
	}
	
	Promise.prototype.then = function(resolveCallback, failCallback, finishCallback) {
		if(this._isResolved && resolveCallback) {
			resolveCallback.apply(this, this._resolveArguments);
		}
		
		else if(this._hasFailed && failCallback) {
			failCallback.apply(this, this._failArguments);
		}
		
		if(this._isFinished) {
			if(finishCallback) {
				finishCallback();
			}
		}
		
		else {
			if(resolveCallback) {
				this._resolveCallbacks.push(resolveCallback);
			}
			
			if(failCallback) {
				this._failCallbacks.push(failCallback);
			}
			
			if(finishCallback) {
				this._finishCallbacks.push(finishCallback);
			}
		}
	}
	
	Promise.prototype.progress = function() {
		var progressArguments = arguments;
		
		if(!this._isFinished) {
			this._progressCallbacks.forEach(function(callback) {
				callback.apply(this, progressArguments);
			});
		}
	}
	
	Promise.prototype.onProgress = function(callback) {
		this._progressCallbacks.push(callback);
	}
	
	Promise.prototype.onFinish = function(callback) {
		if(this._isFinished) {
			callback();
		}
		
		else {
			this._finishCallbacks.push(callback);
		}
	}
	
	Promise.prototype.isResolved = function() {
		return this._isResolved;
	}
	
	Promise.prototype.hasFailed = function() {
		return this._hasFailed;
	}
	
	Promise.prototype.isFinished = function() {
		return this._isFinished;
	}
	
	Promise.prototype._finish = function() {
		this._isFinished = true;
		
		this._finishCallbacks.forEach(function(callback) {
			callback();
		});
	}
	
	return Promise;
});