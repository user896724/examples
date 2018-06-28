define (require) ->
	class WsProxy
		(@_object, channel, @_client, startOn = true) ->
			@_subscription = null
			@_channel = "/sup" + channel
		
			if startOn
				@connect!
			
			@_subscribe "/unsubscribe", ~>
				@disconnect
			
			@_subscribe "/init", ~>
				@connect!
				@init!
		
		init: ->
			@_send "/init", @_object
		
		connect: ->
			if !@_subscription
				@_subscription = @_object.subscribe (type, path, value) ~>
					@_send "/update", {
						type
						path
						value: if type isnt "remove" then value
					}
		
		disconnect: ->
			@_subscription.cancel!
			@_subscription = null
		
		_subscribe: (channel, fn) ->
			@_client.on @_channel + channel, fn

		_send: (channel, data) ->
			@_client.emit @_channel + channel, data
