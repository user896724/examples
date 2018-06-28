Simple Update Propagation
===

A library for notifying other parts of the code when an object's data changes.

This project is designed to make basic synchronisation very easy without imposing
a particular framework or structure upon the code.

Objects become "update propagators" by extending `Sup`:

```livescript
class User extends Sup
	->
		super!
		
		@name = "Derrick Morgan"
```

Subscribe to updates:

```livescript
user = new User

user.subscribe (type, path, value) ->
	console.log type
	console.log path
	console.log value
```

Publish updates:

```livescript
# in User:

@mod "name" "Stranger Cole"
```

The output will be:

```
mod
name
Stranger Cole
```

The modification is actually applied, as well as being published:

```
user.name # => "Stranger Cole"
```

That is the basic foundation of SUP, and it's nothing particularly interesting.
I'll explain `types` and `paths` in more detail later on -- although they
are probably pretty much what you're thinking; types are the different
kinds of operations (add, remove, etc) and paths describe the nesting of
objects -- but for now I'll go straight into the features of SUP that make it
more than just a publish/subscribe system.

These are _adaptors_, _proxies_, and _nesting_.

#### Adaptors

An adaptor subscribes to an update propagator and does something useful with
the updates.  SUP comes with an adaptor for automatically updating a Ractive
template.  Another adaptor might persist changes to a Mongo collection.

#### Proxies

A proxy is an update propagator that listens to some source of events or data,
and publishes them.  SUP comes with an adaptor for sending, and a proxy for
receiving, updates over a websocket.

#### Nesting

An update propagator can be "nested" within another, so that updates published
by the children bubble up and get published by the parent, with an appropriately
prefixed path.

These simple building blocks allow for the creation of arbitrarily complex
synchronisation systems with very little boilerplate code.

Example
---

There is a live demo [here](http://sup-example.hogg-blake.uk)
([code](http://github.com/gushogg-blake/sup-example)).

Here is the annotated code for the server:

```livescript
require! {
	"requirejs"
	"amdefine/intercept"
	"socket.io": socketio
	"sup/adaptors/websocket-server": WsAdaptor
	"sup/List"
	"sup/Sup"
	http
}

requirejs.config nodeRequire: require

socket = socketio 8001

# List "nests" anything you add to it, so you only have to subscribe to
# the list to get updates from everything inside it as well

users = new List
id = 0

class User extends Sup
	(client) ->
		super!
		
		@id = ++id
		@name = "Guest"
		@clicks = 0
		
		# addChild is a helper that adds an update propagator to the current object
		# under the path supplied, and nests it within the current object
		
		@addChild "colours" new List
		
		# WsAdaptor takes an update propagator, a channel to publish on, and
		# a websocket client to send updates to
		
		new WsAdaptor users, "/users", client .init!
		
		# taking advantage of some of LiveScript's syntax sugar,
		# and SUP's simplicity, to set up user action handlers
		# on one line apiece:

		client.on "/set-data" @~merge
		client.on "/click" @~click
		client.on "/add-colour" @colours~add
		client.on "/remove-colour" @colours~delItem
	
	click: ->
		@inc "clicks"
	
	toJSON: ->
		@{ id, name, clicks, colours }

socket.on "connection" (client) ->
	user = new User client
	
	client.on "disconnect" ->
		users.delItem user
		
	# "@" here specifies that the paths of updates propagating up through the
	# users List should be prefixed by the user's index within the array:

	users.add user, "@"
```

Installation
---

Sup is in the bower registry (`bower install sup`), and will be registered on
NPM pending the availability of the `sup` package name.  For now you can install
it in Node packages by calling it whatever you want and putting the Git url as
the version:

```json
"dependencies": {
	"sup": "https://github.com/gushogg-blake/sup-compiled/archive/master.tar.gz"
}
```

Alternatively you can download the code from here and compile it, or get it from
[the compiled repo](https://github.com/gushogg-blake/sup-compiled).
