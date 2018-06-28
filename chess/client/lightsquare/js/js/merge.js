define(function(require) {
	return function(object) {
		for(var i = 1; i < arguments.length; i++) {
			for(var prop in arguments[i]) {
				object[prop] = arguments[i][prop];
			}
		}
	};
});