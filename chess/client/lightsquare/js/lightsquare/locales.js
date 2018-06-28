define(function(require) {
	var locales = {
		"de": require("file!./locales/de.json"),
		"en": require("file!./locales/en.json"),
		"es": require("file!./locales/es.json")
	};
	
	for(var locale in locales) {
		locales[locale] = JSON.parse(locales[locale]);
	}
	
	return locales;
});