define(function(require) {
	return function(object) {
		var newObject = {};
		
		for(var prop in object) {
			newObject[prop] = object[prop];
		}
		
		return newObject;
	}
});