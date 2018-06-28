define (require) ->
	parse: (path) ->
		path / " "
	
	build: (parts) ->
		parts * " "
	
	prefix: (path, prefix, parent, child) ->
		object = parent

		prefix.split " " .map (token) ->
			if token == "@"
				index = object.indexOf child

				object := child

				index
			else if token[0] == "#"
				field = token.substr 1

				"#" + field + "=" + child[field]
			else
				object := object[token]

				token
		.join(" ") + if path then " #path" else ""
	
	traverse: (path, root) ->
		step =
			parent: null
			index: null
			object: root
		
		if path
			path.split " " .forEach (token) ->
				if token[0] == "#"
					[key, value] = token.substr 1 .split "="
					object = null
	
					for item, i in step.object
						if item[key].toString! == value
							object = item
	
							step :=
								parent: step.object
								index: i
								object: object
	
							break
					
					if object is null
						throw "Path traversal failed - no matching object for #token"
				else
					step :=
						parent: step.object
						index: token
						object: step.object[token]

		step
