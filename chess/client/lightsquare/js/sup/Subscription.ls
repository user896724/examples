define (require) ->
	class Subscription
		(@_sup, @_handler) ->
			@active = yes

		send: (type, path, value) ->
			if @active
				if @_handler instanceof Function
					@_handler ...
				else
					@_handler[type] path, value

		cancel: ->
			@_sup.unsubscribe @

		pause: ->
			@active = no

		unpause: ->
			@active = yes
