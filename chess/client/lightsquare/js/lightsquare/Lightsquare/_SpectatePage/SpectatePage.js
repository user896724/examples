define(function(require) {
	require("css!./spectate_page.css");
	var html = require("file!./spectate_page.html");
	var RactiveI18n = require("ractive-i18n/RactiveI18n");
	var Event = require("js/Event");
	var Move = require("jsonchess/Move");
	var Square = require("chess/Square");
	var Colour = require("chess/Colour");
	
	var SQUARE_SIZE = 45;
	
	function SpectatePage(gamesList, router, parent) {
		this._router = router;
		this._gamesList = gamesList;
		
		var viewingAs = {};
		
		this._template = new RactiveI18n({
			el: parent,
			template: html,
			data: {
				squareSize: SQUARE_SIZE,
				pieceUrl: require.toUrl("../piece_sprites/Classic/" + SQUARE_SIZE + ".png"),
				getSquareY: function(squareNo, id) {
					return 7 - Square.bySquareNo[squareNo].adjusted[viewingAs[id]].coords.y;
				},
				getSquareX: function(squareNo, id) {
					return Square.bySquareNo[squareNo].adjusted[viewingAs[id]].coords.x;
				},
				getSquareColour: function(squareNo) {
					var coords = Square.bySquareNo[squareNo].coords;
					
					return (coords.x % 2 === coords.y % 2 ? 'b' : 'w');
				},
				getPieceOffset: function(piece) {
					return (piece ? -"PNBRQKpnbrqk".indexOf(piece) : 1) * SQUARE_SIZE;
				},
				getAbsolutePath: function(path) {
					return require.toUrl(path);
				},
				games: {}
			}
		});
		
		this._gamesList.Update.addHandler(function(details) {
			var id = details.id;
			
			if(!(id in viewingAs)) {
				viewingAs[id] = (Math.random() > .5 ? Colour.white : Colour.black);
			}
			
			this._updateGame(details);
		}, this);
		
		this._gamesList.GameOver.addHandler(function(id) {
			delete this._template.get("games")[id];
			delete viewingAs[id];
			
			this._template.update("games");
		}, this);
		
		this._template.on("click_game", (function(event, id) {
			this._router.setPath("/game/" + id);
		}).bind(this));
	}
	
	SpectatePage.prototype._updateGame = function(details) {
		this._template.set("games." + details.id, details);
	}
	
	SpectatePage.prototype.show = function() {
		this._gamesList.startUpdating();
	}
	
	SpectatePage.prototype.hide = function() {
		this._gamesList.stopUpdating();
		this._template.set("games", {});
	}
	
	return SpectatePage;
});
