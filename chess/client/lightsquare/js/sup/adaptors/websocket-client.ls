define (require) ->
	require! {
		"sup/Path"
		"sup/Sup"
		"rsvp/rsvp": { Promise }
	}
	
	class Proxy
		(@_socket, channel) ->
			@_channel = "/sup#channel"
	
		init: (Class, sendInitMessage = false) ->
			new Promise (fulfill, reject) ~>
				buffer = []
				object = null
				
				@_subscribe "/update", ({ type, path, value }) ->
					if object
						object.update type, path, value
					else
						buffer.push { type, path, value }
				
				@_subscribe "/init", (initialData) ->
					object := new Class initialData
					
					fulfill object
					
					buffer.forEach ({ type, path, value }) ->
						object.publish type, path, value
				
				if sendInitMessage
					@_send "/init"
		
		cancel: ->
			@_send "/unsubscribe"
		
		_send: (channel, data) ->
			@_socket.emit @_channel + channel, data
		
		_subscribe: (channel, fn) ->
			@_socket.on @_channel + channel, fn
