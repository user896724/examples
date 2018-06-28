define(function() {
	var id = Math.floor(new Date / 1000);

	return function() {
		return (++id).toString(36);
	};
});