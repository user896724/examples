Chess
====

JavaScript chess rules library
---------------------

This library implements the rules of chess.  It should probably be considered incorrect/incomplete, as it hasn't been put through a comprehensive test suite.

### Overview of the modules

#### Board

Represents a board -- keeps track of the locations of pieces, but doesn't know anything else about the position.  Used in the Position class, which holds all the same information as a FEN string.

This class also has methods for detecting certain things about a position which can be known just from looking at the board, for example, whether a move from one square to another is blocked, or what squares a pawn could theoretically move to from a given square.

#### CastlingRights

Represents the castling rights part of a FEN string, with methods for setting and checking the different castling possibilities and obtaining the FEN or X-FEN string.

#### Clock

Given a Game, a TimingStyle and an optional callback for obtaining the current time, keeps track of the time situation and fires an event when someone's time runs out.

If no callback is supplied, the Clock uses `new Date().valueOf()`.  One use-case for supplying the callback is if you have a function that returns an estimate of the current time on a server, and you want a chess-playing client to reflect the server's time situation as accurately as possible.

#### Colour

All code that deals with colours deals with instances of this class, which is closed behind the module interface.  To get a Colour, use `Colour.fromFenString` passing `"w"` or `"b"`, or `Colour.white` or `Colour.black`.  There are exactly two instances of the Colour class at any one time, so you can be sure that `colourA === colourB` if they are the same colour.

Colours have a `name` property, which is either `"white"` or `"black"`, and a `fenString` property, which is either `"w"` or `"b"`.

#### Coords

An object with `x`, `y` and `isOnBoard`.  This is used for calculations which are easier to do with numeric coordinate pairs than other square representations (algebraic etc).  The x/y properties refer to the file and rank of a square -- x goes from 0-7 ("a" - "h") and y goes from 0-7 ("1" - "8").  `isOnBoard` indicates whether the coordinate pair is within the bounds of a normal chessboard.

#### Fen

Represents a FEN string.  This module basically takes a FEN string and splits it on the space character, and exposes each field as a property.  It also has static methods for converting between FEN positions and arrays of Pieces, and holds some FEN-related constants.

Not all code that deals with FEN strings uses the Fen module -- Colour deals with the FEN representations of colours, for example, but just hard-codes `"w"` and `"b"`.  This seems acceptable given the stability, wide acceptance and obvious meaning of the strings.

#### Game

Represents a chess game.  Has methods to make moves, get the current Position, etc.  Game fires an event when a move is made and when the game ends.

All the details and functionality related to a game of chess is here, except for information about the players and ratings, which aren't dealt with at all in this library.  The concepts of players, ratings, tournaments, etc, are application-specific and likely to vary widely with the different uses of the library, so their implementation is left entirely up to the application developer.

#### Move

Represents a move.  The Game history is an array of Moves.  A Move takes a starting Position, from Square, to Square, and optional promotion PieceType.  It has methods for checking whether it is legal, whether it's a capture move, a castling move, a promotion move etc, and for getting the Position that results from making the move.  For illegal moves, the resulting Position is the same as the original position.

Most of the logic for checking legality and calculating the effect of a move on the position is in private methods on the Move class -- Move can be considered the top-level code responsible for implementing the rules pertaining to individual moves (legality and effects on the position), whereas Game handles rules regarding the aggregate of moves and the overall game (repetition rules, stalemate, etc).

#### MoveLabel

A utility class for building up the label of a move, e.g. "e8=Q#".  Move uses it to build the move labels by setting its properties (`piece` is the "N" in "Nb3"; `disambiguation` is the "8" in "R8d7", etc), and its toString just concatenates all the properties in the right order.

#### Piece

Represents a piece (as a certain type and colour as opposed to a specific piece in a specific position).  There are exactly twelve Piece instances at any one time, and the class is closed behind the module interface -- use `get(PieceType, Colour)` or `fromFenString` to obtain Pieces.  `pieceA === pieceB` if they're the same type and colour.

All pieces in the library are represented by instances of this class.  It has properties for getting the FEN representation, type and colour etc.

Note - from now on I'll refer to the attributes above (exact amount at any time, object identity guarantee, and no direct access to the constructor outside the module) under the term "value objects".

#### PieceType

Value object representing the different types of piece (Pawn, Knight, Bishop, Rook, Queen, King).  The `type` property on Pieces refers to an instance of PieceType.

PieceType has properties for getting the value (1 for pawns up to 9 for queens and `Infinity` for kings), the FEN representations for each colour and the SAN string.

#### Position

Represents a position, with all the same information as a FEN or X-FEN string.

Position has methods for getting a list of all the possible moves in that position, and checking whether a player is in check/checkmate.

There are public methods for setting things like the current en-passant square and the active colour, so any classes that deal with Positions should be careful not to pass out references to Positions which shouldn't be modified by other code. For example, `Game.getPosition` returns a copy to ensure that the Game's internal position stays consistent no matter what the calling code does with its position.  Position provides `getCopy()` for this purpose.

#### Result

Represents a result, holding all the information about the result of a Game that has reached a win/loss/draw, as opposed to being in-progress or aborted.

Result is closed behind the module interface, which exposes the methods `win` (get a winning result given a winning colour and a type), `draw` (get a draw result given a type), and the result type constants under `types`.

The `type` property is set to one of the `Result.types` constants.  The other properties contain useful details about the result, such as the scores (0, 0.5 or 1) indexed by colour and the score summary string ("1-0" etc).

Example:

```
var result = Result.win(Colour.white, Result.types.CHECKMATE);

result.scores[Colour.white]; //1
result.description; //"white won by checkmate"
```

#### Square

Value object representing the squares on the board.  As with Colours and Pieces, they are closed behind methods for retrieving them based on common representations (`fromAlgebraic` etc) and have properties containing other representations and useful information about them.

Square objects also have an `adjusted` property which contains Squares indexed by colour.  Under "w" is a reference to the Square itself, and under "b" is a reference to the square's opposite.  For example:

```
var a1 = Square.fromAlgebraic("a1");

a1.adjusted[Colour.white].algebraic; //"a1"
a1.adjusted[Colour.black].algebraic; //"h8"
```

This is useful for calculations that depend on directionality based on colour, e.g. checking that a pawn is moving "forwards".

#### Time

Represents an amount of time, as opposed to a point in time.  This module has functionality for reading a human-readable description of a time control, e.g. `"10m 5s"`, and converting it to milliseconds (605000 in this case).

Instances of the Time class have methods for converting back to various human-readable representations, e.g. "10m" or "10:00", as well as methods for manipulating the underlying time value.

`valueOf` returns the milliseconds, so an instance of the Time class can be used in some calculations that expect a quantity of time in milliseconds.

#### TimingStyle

TimingStyles describe the time controls of a game in detail, including:

- how much time each player starts with
- how much time is added after each move
- when timing starts
- overtime (an extra period of time added after a certain move)

Clock accepts a TimingStyle.  Wrapping up the various options into an object like this reduces the number of parameters the Clock constructor would need to take, or the different setters it would need.

TimingStyle also has a method for getting a human-readable description of the time control, e.g. `"1h30 | 30 + 30m @ 40 moves"`.

### Module format

This library can be used on the browser and in node, but the modules are only defined to the AMD specification, so they must be required through requirejs.

To enable requiring them through Node's built-in `require`, use [amdefine/intercept](https://github.com/jrburke/amdefine#amdefineintercept).
