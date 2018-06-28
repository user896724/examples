define (require) ->
	require! {
		"Array.prototype/remove"
		"./Subscription"
		"./Path"
	}

	class Sup
		(@object = @) ->
			@_subscriptions = []
			
			@_operations =
				add: (path, value) ~>
					object = @object
					
					if path
						object = Path.traverse path, object .object
					
					object.push value
					
					@publish "add", path, value
				
				del: (path) ~>
					step = Path.traverse path, @object
					step.parent.splice step.index, 1
					
					@publish "del", path
				
				mod: (path, value) ~>
					step = Path.traverse path, @object
					step.parent[step.index] = value
					
					@publish "mod", path, value
				
				merge: (path, value) ~>
					object = @object
					
					if path
						object = Path.traverse path, @object .object
					
					object <<< value
					
					@publish "merge", path, value
			
		del: ->
			@_operations.del ...
		
		delItem: (item, path = "") ->
			object = @object

			if path
				object = Path.traverse path, object .object

			while (index = object.indexOf item) != -1
				@del "#path #index".trim!
		
		add: (value, path = "") ->
			@_operations.add path, value

		mod: ->
			@_operations.mod ...
		
		merge: (path, value) ->
			if typeof! path is "Object"
				value = path
				path = ""
			
			@_operations.merge path, value
			
		update: (type, path, value) ->
			@_operations[type] path, value
		
		inc: (path) ->
			@_operations.mod path, Path.traverse(path, @object).object + 1
		
		dec: (path) ->
			@_operations.mod path, Path.traverse(path, @object).object - 1

		publish: (type, path, value) ->
			@_subscriptions.forEach (.send type, path, value)

		subscribe: (handler) ->
			subscription = new Subscription @, handler
			@_subscriptions.push subscription
			subscription

		unsubscribe: ->
			@_subscriptions.remove it

		pipe: (sup) ->
			@subscribe (type, path, value) ~>
				sup.update type, path, value

		nest: (sup, prefix) ->
			@subscribe (type, path, value) ~>
				sup.publish type, Path.prefix(path, prefix, sup.object, @object), value
		
		addChild: (path, sup) ->
			step = Path.traverse path, @object
			step.parent[step.index] = sup
			sup.nest @, path
