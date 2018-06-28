define (require) ->
	/*
	creates a copy of a value with toJSON called on all applicable
	objects
	
	since it loops over all properties, circular references can only
	be followed to a certain depth.  that's what the stack and
	circularDepth arguments are for - they're only used internally.
	*/
	
	MAX_CIRCULAR_DEPTH = 2
	
	function cloneToJson object, stack = [], circularDepth = 0
		type = typeof! object
		
		if type in <[ Object Array ]>
			if object in stack
				circularDepth++
			
			if circularDepth < MAX_CIRCULAR_DEPTH
				stack.push object
				
				if type is \Object
					json = {}
					
					for key, value of object
						if value and value.toJSON
							value = value.toJSON!
							
						json[key] = cloneToJson value, stack, circularDepth
					
					json
				
				else
					object.map ->
						cloneToJson it, stack, circularDepth
			
			else
				"(circular)"
		
		else
			object
