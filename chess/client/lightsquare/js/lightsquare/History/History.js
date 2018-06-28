define(function(require) {
	require("css!./history.css");
	var html = require("file!./history.html");
	var RactiveI18n = require("ractive-i18n/RactiveI18n");
	var Event = require("js/Event");
	var Colour = require("chess/Colour");
	var Fullmove = require("./_Fullmove");

	function History(parent) {
		this.UserSelect = new Event();
		
		this._fullmoves = [];
		this._scrollOnNewMoves = true;
		
		this._template = new RactiveI18n({
			template: html,
			el: parent,
			data: {
				selectedMove: null,
				fullmoves: this._fullmoves
			}
		});
		
		this._template.on("select", (function(event, move) {
			this.select(move);
			this.UserSelect.fire(move);
		}).bind(this));
		
		this._historyNode = this._template.nodes.history;
		
		this._historyNode.addEventListener("scroll", (function() {
			var node = this._historyNode;
			
			this._scrollOnNewMoves = (node.scrollHeight - node.scrollTop === node.clientHeight);
		}).bind(this));
	}

	History.prototype.move = function(move) {
		var lastFullmove = this._getLastFullmove();
		
		if(lastFullmove === null || move.colour === Colour.white) {
			lastFullmove = new Fullmove();
			
			this._fullmoves.push(lastFullmove);
		}

		lastFullmove.add(move);
		
		this._updateLastFullmove();
			
		if(this._scrollOnNewMoves) {
			this._historyNode.scrollTop = this._historyNode.scrollHeight;
		}
	}

	History.prototype.undo = function() {
		var fullmove = this._getLastFullmove();
		var move = this._getLastMove();

		if(move !== null) {
			fullmove.remove(move);
		
			if(fullmove.isEmpty()) {
				this._fullmoves.pop();
			}
			
			else {
				this._updateLastFullmove();
			}
		}
		
		if(this._getSelectedMove() === move) {
			this.select(this._getLastMove());
		}
	}

	History.prototype.select = function(move) {
		this._template.set("selectedMove", move);
	}

	History.prototype.clear = function() {
		this._fullmoves.splice(0, this._fullmoves.length);
	}

	History.prototype._getLastMove = function() {
		var fullmove = this._getLastFullmove();

		return (fullmove ? fullmove.getLastMove() : null);
	}
	
	History.prototype._getLastFullmove = function() {
		return (this._fullmoves[this._fullmoves.length - 1] || null);
	}
	
	History.prototype._getSelectedMove = function() {
		return this._template.get("selectedMove");
	}
	
	History.prototype._updateLastFullmove = function() {
		this._template.update("fullmoves." + (this._fullmoves.length - 1));
	}

	return History;
});