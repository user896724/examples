define(function(require) {
	function Route(route, onEnter, onLeave, isPartial) {
		this._isPartial = !!isPartial;
		this._onEnter = onEnter;
		this._onLeave = onLeave;
		
		this._routeParts = this._getPathParts(route).map((function(part) {
			var routePart = {
				value: part,
				isParameter: false
			};
			
			if(part.charAt(0) === ":") {
				routePart.value = part.substr(1);
				routePart.isParameter = true;
			}
			
			return routePart;
		}).bind(this));
	}
	
	Route.prototype.enterIfMatches = function(path) {
		var result = this._check(path);
		
		if(result.matches) {
			this._onEnter(result.params, path);
		}
		
		return result.matches;
	}
	
	Route.prototype.leave = function() {
		if(this._onLeave) {
			this._onLeave();
		}
	}
	
	Route.prototype._getPathParts = function(path) {
		var parts = ["/"];
		
		if(path !== "/") {
			parts = parts.concat(path.split("/").slice(1));
		}
		
		return parts;
	}
	
	Route.prototype._check = function(path) {
		var result = {
			matches: false,
			params: {}
		};
		
		if(path !== null) {
			var pathParts = this._getPathParts(path);
			var checkParts = (this._isPartial ? this._routeParts.length : pathParts.length);
			
			if(!this._isPartial && pathParts.length !== this._routeParts.length) {
				result.matches = false;
			}
			
			else {
				var doesntMatch = false;
				var routePart, pathPart;
				
				for(var i = 0; i < checkParts; i++) {
					routePart = this._routeParts[i];
					pathPart = pathParts[i];
					
					if(routePart.isParameter) {
						result.params[routePart.value] = pathPart;
					}
					
					else if(pathPart !== routePart.value) {
						doesntMatch = true;
						
						break;
					}
				}
				
				result.matches = !doesntMatch;
			}
		}
		
		return result;
	}
	
	return Route;
});