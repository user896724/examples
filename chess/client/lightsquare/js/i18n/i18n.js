define(function(require) {
	require("sprintf/src/sprintf");
	
	return {
		__: function(locale, string, replacements) {
			if(string in locale) {
				string = locale[string];
			}
			
			if(replacements) {
				string = vsprintf(string, replacements);
			}
			
			return string;
		},
		
		__n: function(locale, singularVersion, count, replacements) {
			var string = singularVersion;
			
			if(string in locale) {
				var translations = locale[string];
				
				if(count === 0) {
					string = translations.zero;
				}
				
				else if(count === 1) {
					string = translations.one;
				}
				
				else {
					string = translations.other;
				}
			}
			
			if(replacements) {
				string = vsprintf(string, replacements);
			}
			
			return string;
		}
	};
});