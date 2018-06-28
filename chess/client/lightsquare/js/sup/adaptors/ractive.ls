define (require) ->
	require! {
		"../Path"
		"../utils/cloneToJson"
	}
	
	(sup, template, field) ->
		function ractivePath path
			if path
				field + "." + Path.parse path .join "."
			else
				field
		
		template.set field, cloneToJson sup.object
		
		sup.subscribe do
			mod: (path, value) ->
				template.set ractivePath(path), cloneToJson value
			
			add: (path, value) ->
				template.push ractivePath(path), cloneToJson value
			
			del: (path) ->
				parts = Path.parse path
				index = parts.pop!
				arrayPath = ractivePath Path.build parts
				template.splice arrayPath, index, 1
			
			merge: (path, values) ->
				json = cloneToJson values
				parts = Path.parse path
				
				for key, value of json
					path = Path.build parts ++ key
					template.set ractivePath(path), cloneToJson value
