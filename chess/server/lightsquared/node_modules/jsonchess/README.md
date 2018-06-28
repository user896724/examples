jsonchess
=========

jsonchess is a client/server protocol for playing chess online.  This project provides some JavaScript
code to define protocol constants and assist with the implementation on
both ends.

Message format
--------------

The basic format of all messages exchanged on the protocol is a JSON
object with a `topic` field and an optional `data`
field. The topics look like URL paths:

`/game/123/move`

The whole message sent by the server when the move e4 is played in the
game with id "123" looks like this:

	{	
		"topic": "/game/123/move",
		"data": {	
			"from": 12,
			"to": 28,
			"index": 0,
			"time": 1407781765400
		}
	}

Feeds (deprecated)
------------------

For basic updates, the protocol has a concept of "feeds", which are streams of
data represented by a name.  The purpose of this is mostly just to provide some
way for the client to indicate which updates it is and isn't interested in, for
performance reasons.

The currently defined feeds are:

- `random_games` - a small number of games selected from the currently active
	games on the site.  The client receives a small data structure containing
	the current position, and the last move played, if applicable.
- `users_online` - the client receives updates when a user connects or disconnects,
	and receives the full list of online users upon activating the feed.
- `open_seeks` - the client receives updates when a new seek is created (if the seek
	options would allow the player to accept) and when a seek expires.  (The client
	requests the full seek list separately.)

Generic updates/channels
------------------------

The feeds system will be superseded by a generic updates system, which will
use the concept of channels to decide which users to send different updates to.

Generic update messages will consist of an operation, a key describing the object
that the operation will apply to, and a value.

The operations are:

- add - add an item to an array.
- remove - remove an item from an array.
- update - update a property on an object.

The keys are object property names with a syntax for describing nested properties
and objects within arrays.  They will look like normal JavaScript object notation,
with two differences:

- the dot can be used to reference things in arrays by the index (which would be a
syntax error in JS).
- a colon can be used after an array, followed by an id, which will be used to look
up whatever object within the array that has that id.  This is to fit with how things
are done in the rest of the protocol and protect against scenarios such as a client
receiving an update for an item in an array which has already been deleted, and consequently
updating the wrong item, because it received the messages out of order.

The value means different things depending on the operation:

- add - the value gets added to the array.
- remove - the value is the id of the item to be removed from the array.
- update - the new value of the field.

Each JavaScript file in this repo is described briefly below.

###glicko2

Constants related to the glicko2 rating system.

###gameRestoration

Constants related to the game restoration module.

###constants

General constants.

###Move

jsonchess uses a custom encoding format for moves.  Its purpose is to be the best compromise between size and speed of decoding; having as much information as necessary for a client to avoid having to do expensive chess rules calculations, while not including overly verbose pieces of information such as the full FEN string of the resulting position.

Move contains methods for converting between the jsonchess string representation, and move objects.

The move objects have the same public fields as Moves from the [chess](http://github.com/gushogg-blake/chess) library.

####Encoding

The string representation consists of a variable number of fields, comma-separated.  There are 8 initial fields which are always present:

- The fullmove number
- The move index
- The SAN move label
- A numeric timestamp of when the move was made
- The 'from' square's algebraic representation (king origin for castling)
- The 'to' square's algebraic representation (king destination for castling)
- One of `N`, `K`, `Q` or `A` to indicate which castling rights, if any, were lost in the move
- The new en-passant target square's algebraic representation, or `N` if not a double pawn move

For non-castling, non-promotion, non-en-passant moves that's all there is.

For castling moves there are 3 extra fields:

- `c`, to indicate castling
- The rook origin square's algebraic representation
- The rook destination square's algebraic representation

For promotion moves there are 2 extra fields:

- `p` to indicate promotion
- The SAN representation of the promotion piece type (N, B, R or Q)

For en-passant moves there are 2 extra fields:

- `ep` to indicate en-passant
- The captured pawn square's algebraic representation

####Decoding

Knowledge of the initial position is required for calculating certain aspects of the move, e.g. the captured piece.  For regular moves, the type of piece that moved must be calculated from the initial position.  Most necessary decoding calculations are square lookups such as these, or simple conditionals.

###Premove

Checks the validity of a premove and outputs a jsonchess premove structure from
toJSON.

###chatMessageTypes

The types of message that can be sent on the server-wide chatroom; e.g. messages
from other users, messages coming from admin, automatically generated server messages
etc.