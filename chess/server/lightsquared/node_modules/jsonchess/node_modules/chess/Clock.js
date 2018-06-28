define(function(require) {
	var time = require("js/time");
	var Event = require("js/Event");
	var Colour = require("./Colour");
	
	var MILLISECONDS = 1000;
	
	function Clock(game, timingStyle, getCurrentTime) {
		this.Timeout = new Event(this);
		
		this._game = game;
		this._lastMoveIndex = -1;
		this.timingStyle = timingStyle;
		this._timeoutTimer = null;
		this._startOrLastMoveTime = this._game.startTime + this.timingStyle.initialDelay;
		this._isRunning = this._game.isInProgress;
		this._stopTime = this._game.endTime;
		this._getCurrentTime = getCurrentTime || time;
		this._timeLeft = {};
		
		this._addedTime = {};
		this._addedTime[Colour.white] = 0;
		this._addedTime[Colour.black] = 0;
		
		this.calculateTimes();
		this._handleGameEvents();
		this._setTimeoutTimer();
	}
	
	Clock.prototype.getTimeLeft = function(colour) {
		var activeColour = this._game.position.activeColour;
		
		colour = colour || activeColour;
		
		var timeLeft = this._timeLeft[colour];
		
		if(colour === activeColour && this.timingHasStarted()) {
			var thinkingTime = (this._stopTime || this._getCurrentTime()) - this._startOrLastMoveTime;
			
			timeLeft -= thinkingTime;
		}
		
		return Math.max(0, timeLeft + this._addedTime[colour]);
	}
	
	Clock.prototype.addTime = function(time, colour) {
		this._addedTime[colour || this._game.position.activeColour] += time;
	}
	
	Clock.prototype.calculateTimes = function() {
		this._lastMoveIndex = -1;
		this._startOrLastMoveTime = this._game.startTime + this.timingStyle.initialDelay;
		this._timeLeft[Colour.white] = this.timingStyle.initialTime;
		this._timeLeft[Colour.black] = this.timingStyle.initialTime;
		
		this._game.history.forEach((function(move) {
			this._move(move);
		}).bind(this));
	}
	
	Clock.prototype._stop = function() {
		if(this._isRunning) {
			if(this._timeoutTimer !== null) {
				clearTimeout(this._timeoutTimer);
			}
			
			this._isRunning = false;
			this._stopTime = this._getCurrentTime();
		}
	}
	
	Clock.prototype.getDescription = function() {
		return this.timingStyle.getDescription();
	}
	
	Clock.prototype._handleGameEvents = function() {
		this._game.Move.addHandler(function(move) {
			if(this._isRunning) {
				this._move(move);
				this._setTimeoutTimer();
			}
		}, this);
		
		this._game.GameOver.addHandler(function() {
			this._stop();
		}, this);
	}
	
	Clock.prototype._move = function(move) {
		var moveTime = move.time;
		var colour = move.colour;
		var timeLeft = this._timeLeft[colour];
		var thinkingTime = moveTime - this._startOrLastMoveTime;
		
		if(this.timingHasStarted()) {
			timeLeft -= thinkingTime;
			timeLeft += this.timingStyle.increment;
			
			if(this.timingStyle.isOvertime && move.fullmove === this.timingStyle.overtimeFullmove) {
				timeLeft += this.timingStyle.overtimeBonus;
			}
		}
		
		this._timeLeft[colour] = timeLeft;
		this._lastMoveIndex++;
		this._startOrLastMoveTime = moveTime;
	}
	
	Clock.prototype._setTimeoutTimer = function() {
		if(this._timeoutTimer !== null) {
			clearTimeout(this._timeoutTimer);
		}
		
		if(this._isRunning && this.timingHasStarted()) {
			this._timeoutTimer = setTimeout((function() {
				this._timeout();
			}).bind(this), this.getTimeLeft());
		}
	}
	
	Clock.prototype._timeout = function() {
		if(this.getTimeLeft() <= 0) {
			this.Timeout.fire();
		}
		
		else {
			this._setTimeoutTimer();
		}
	}
	
	Clock.prototype.timingHasStarted = function() {
		return (
			this._lastMoveIndex >= this.timingStyle.firstTimedMoveIndex - 1
			&& this._getCurrentTime() >= this._startOrLastMoveTime
		);
	}
	
	return Clock;
});