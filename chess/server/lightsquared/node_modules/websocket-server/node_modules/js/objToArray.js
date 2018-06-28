define(function(require) {
	function objToArray(obj) {
		var array = [];
		
		for(var id in obj) {
			array.push(obj[id]);
		}
		
		return array;
	}
	
	return objToArray;
});