define(function(require) {
	var i18n = require("i18n/i18n");
	var Ractive = require("ractive/ractive");
	var sprintf = require("sprintfjs/sprintf");
	
	return Ractive.extend({
		data: {
			locale: {},
			
			__: function(string, replacements) {
				return i18n.__(this.get("locale"), string, replacements);
			},
			
			__n: function(singularVersion, count, replacements) {
				return i18n.__n(this.get("locale"), singularVersion, count, replacements);
			}
		},
		decorators: {
			ref: function(el, ref) {
				if(!this.nodes) {
					this.nodes = {};
				}
				
				this.nodes[ref] = el;
				
				return {
					teardown: function() {}
				};
			}
		}
	});
});