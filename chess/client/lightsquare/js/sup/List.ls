define (require) ->
	require! {
		"./Sup"
	}

	class List extends Sup
		(@_items = []) ->
			super @_items
			
			@length = @_items.length
			
			@subscribe ~>
				@length = @_items.length

		add: (item, nestPrefix) ->
			super item
			
			if nestPrefix
				item.nest @, nestPrefix
		
		toJSON: ->
			@_items
