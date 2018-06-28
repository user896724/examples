define(function(require) {
	require("css!./seek_graph.css");
	require("Array.prototype/getShallowCopy");
	var html = require("file!./seek_graph.html");
	var Event = require("js/Event");
	var Time = require("chess/Time");
	var RactiveI18n = require("ractive-i18n/RactiveI18n");
	
	var AVERAGE_MOVES_PER_GAME = 30;
	
	function getAbsoluteRating(ownerRating, ratingSpecifier) {
		var firstChar = ratingSpecifier.charAt(0);
		
		if(firstChar === "-" || firstChar === "+") {
			return ownerRating + parseInt(ratingSpecifier);
		}
		
		else {
			return parseInt(ratingSpecifier);
		}
	}
	
	function SeekGraph(seekList, user, parent) {
		this._seekList = seekList;
		this._user = user;
		
		this._graphHeightInEm = 30;
		this._seekHeightInEm = 2;
		
		this._gridResolution = {
			x: 2,
			y: 1
		};
		
		this._timeBrackets = ["0", "3m", "10m", "20m", "1h"].map(function(lowerBound, index, lowerBounds) {
			var upperBound = null;
			var previous = lowerBounds[index - 1];
			var next = lowerBounds[index + 1];
			var label = lowerBound + " - " + next;
			
			if(next) {
				upperBound = Time.fromUnitString(next);
			}
			
			if(!previous) {
				label = "< " + next;
			}
			
			else if(!next) {
				label = "> " + lowerBound;
			}
			
			return {
				index: index,
				lowerBound: Time.fromUnitString(lowerBound),
				upperBound: upperBound,
				label: label
			};
		});
		
		this._timeBracketWidthInPercent = 100 / this._timeBrackets.length;
		
		this._minRating = 1000;
		this._maxRating = 2200;
		
		this._ratingBracketSize = 100;
		
		this._ratingBrackets = [];
		
		for(var rating = this._minRating; rating <= this._maxRating; rating += this._ratingBracketSize) {
			this._ratingBrackets.push(rating);
		}
		
		this._setupTemplate(parent);
		this._updateTemplate();
		this._updateCurrentSeek();
	}
	
	SeekGraph.prototype._setupTemplate = function(parent) {
		var graphRangeInEm = this._graphHeightInEm - this._seekHeightInEm;
		var ratingRange = this._maxRating - this._minRating;
		
		this._template = new RactiveI18n({
			el: parent,
			template: html,
			data: {
				locale: this._user.getLocaleDictionary(),
				graphHeightInEm: this._graphHeightInEm,
				seekHeightInEm: this._seekHeightInEm,
				timeBracketWidthInPercent: this._timeBracketWidthInPercent,
				timeBrackets: this._timeBrackets,
				seeks: [],
				currentSeekId: null,
				userRating: this._user.getRating()
			}
		});
		
		this._template.on("accept", (function(event, id) {
			this._user.acceptSeek(id);
		}).bind(this));
		
		this._seekList.Updated.addHandler(function() {
			this._updateTemplate();
		}, this);
		
		this._user.SeekCreated.addHandler(function() {
			this._updateCurrentSeek();
			this._updateTemplate();
		}, this);
		
		this._user.SeekExpired.addHandler(function() {
			this._updateCurrentSeek();
			this._updateTemplate();
		}, this);
	}
	
	SeekGraph.prototype._updateTemplate = function() {
		var occupiedGridSquares = {};
		var seeks = this._seekList.getItems();
		var graphRangeInEm = this._graphHeightInEm - this._seekHeightInEm;
		var ratingRange = this._maxRating - this._minRating;
		var graphSeeks = [];
		
		seeks.forEach((function(seek, index) {
			var rating = seek.owner.rating;
			var ratingBracket = Math.max(this._minRating, rating - rating % this._ratingBracketSize);
			var estimatedTotalTime = seek.options.initialTime + seek.options.timeIncrement * AVERAGE_MOVES_PER_GAME;
			var timeBracket;
			
			this._timeBrackets.getShallowCopy().reverse().some(function(bracket) {
				if(estimatedTotalTime > bracket.lowerBound) {
					timeBracket = bracket;
					
					return true;
				}
			});
			
			var leftOffset = timeBracket.index * this._timeBracketWidthInPercent;
			
			if(timeBracket.upperBound !== null) {
				var bracketRange = timeBracket.upperBound - timeBracket.lowerBound;
				var timeWithinRange = estimatedTotalTime - timeBracket.lowerBound;
				var offsetWithinBracket = (timeWithinRange / bracketRange) * this._timeBracketWidthInPercent;
				
				leftOffset += offsetWithinBracket;
			}
			
			var ratingAboveMinimum = Math.max(0, seek.owner.rating - this._minRating);
			var topOffset = Math.max(0, graphRangeInEm - ratingAboveMinimum / (ratingRange / graphRangeInEm));
			
			var gridX = leftOffset - leftOffset % this._gridResolution.x;
			var gridY = topOffset - topOffset % this._gridResolution.y;
			var gridSquare = gridX + "," + gridY;
			var gridSquaresMoved = 0;
			var maxGridSquaresToMove = 3;
			
			while(gridSquare in occupiedGridSquares && gridSquaresMoved <= maxGridSquaresToMove) {
				gridX += this._gridResolution.x;
				gridY += this._gridResolution.y;
				leftOffset = gridX;
				topOffset = gridY;
				gridSquare = gridX + "," + gridY;
				gridSquaresMoved++;
			}
			
			var acceptsRating = {
				min: getAbsoluteRating(rating, seek.options.acceptRatingMin),
				max: getAbsoluteRating(rating, seek.options.acceptRatingMax)
			};
			
			var userRating = this._user.getRating();
			var currentSeek = this._user.getCurrentSeek();
			
			if(
				(currentSeek !== null && seek.id === currentSeek.id)
				|| (userRating >= acceptsRating.min && userRating <= acceptsRating.max)
			) {
				if(!(gridSquare in occupiedGridSquares) && gridSquaresMoved <= maxGridSquaresToMove) {
					topOffset -= this._seekHeightInEm * index;
					
					graphSeeks.push({
						leftOffsetInPercent: leftOffset,
						topOffsetInEm: topOffset,
						seek: {
							id: seek.id,
							owner: seek.owner.name,
							initialTime: Time.fromMilliseconds(seek.options.initialTime).getUnitString(Time.minutes),
							timeIncrement: Time.fromMilliseconds(seek.options.timeIncrement).getUnitString(Time.seconds)
						}
					});
					
					occupiedGridSquares[gridSquare] = true;
				}
			}
		}).bind(this));
		
		this._template.set("seeks", graphSeeks);
	}
	
	SeekGraph.prototype._updateCurrentSeek = function() {
		var currentSeek = this._user.getCurrentSeek();
		
		this._template.set("currentSeekId", (currentSeek ? currentSeek.id : null));
	}
	
	return SeekGraph;
});