define(function(require) {
	require("Array.prototype/contains");
	var Event = require("js/Event");
	var Route = require("./_Route");

	function Router(addressBarPath, prefix) {
		this._addressBarPath = addressBarPath;
		this._prefix = prefix || "";
		this._routes = [];
		this._lastMatchedRoutes = [];
		this.PathChanged = new Event();
		
		this._addressBarPath.Changed.addHandler(function() {
			this.execute();
			this.PathChanged.fire(this.getPath());
		}, this);
	}
	
	Router.prototype.createChild = function(prefix) {
		return new Router(this._addressBarPath, this._prefix + (prefix || ""));
	}
	
	Router.prototype.addRoute = function(route, onEnter, onLeave) {
		this._routes.push(new Route(route, onEnter, onLeave, false));
	}
	
	Router.prototype.addPartialRoute = function(route, onEnter, onLeave) {
		this._routes.push(new Route(route, onEnter, onLeave, true));
	}
	
	Router.prototype.getPath = function() {
		return this.getRelativePath(this._addressBarPath.get());
	}
	
	Router.prototype.setPath = function(path) {
		this._addressBarPath.set(this._prefix + path);
	}
	
	Router.prototype.getAbsolutePath = function(path) {
		return this._prefix + path;
	}
	
	Router.prototype.getRelativePath = function(path) {
		if(path.substr(0, this._prefix.length) === this._prefix) {
			return path.substr(this._prefix.length) || "/";
		}
		
		else {
			return null;
		}
	}
	
	Router.prototype.execute = function() {
		var path = this.getPath();
		var matchedRoutes = [];
		
		this._routes.forEach((function(route) {
			if(route.enterIfMatches(path)) {
				matchedRoutes.push(route);
			}
		}).bind(this));
		
		this._lastMatchedRoutes.forEach(function(route) {
			if(!matchedRoutes.contains(route)) {
				route.leave();
			}
		});
		
		this._lastMatchedRoutes = matchedRoutes;
	}
	
	return Router;
});