define(function(require) {
	require("css!./seek_form.css");
	var html = require("file!./seek_form.html");
	var RactiveI18n = require("ractive-i18n/RactiveI18n");
	var jsonChessConstants = require("jsonchess/constants");
	var Time = require("chess/Time");
	
	function SeekForm(user, server, parent) {
		this._user = user;
		this._server = server;
		
		this._template = new RactiveI18n({
			el: parent,
			template: html,
			data: {
				locale: this._user.getLocaleDictionary(),
				waiting: false,
				percentExpired: null,
				initialTime: "10m",
				timeIncrement: "5",
				ratingMin: "-100",
				ratingMax: "+100"
			}
		});
		
		this._clearErrorTimer = null;
		this._timeoutAnimation = null;
		this._updateCurrentSeek();
		
		this._template.on("create_or_cancel", (function(event) {
			event.original.preventDefault();
			
			if(this._template.get("waiting")) {
				this._user.cancelSeek();
			}
			
			else {
				this._clearError();
				this._clearClearErrorTimer();
				
				this._user.seekGame({
					initialTime: Time.fromUnitString(this._template.get("initialTime").toString(), Time.minutes).getMilliseconds(),
					timeIncrement: Time.fromUnitString(this._template.get("timeIncrement").toString(), Time.seconds).getMilliseconds(),
					acceptRatingMin: this._template.get("ratingMin").toString(),
					acceptRatingMax: this._template.get("ratingMax").toString()
				}).then((function() {
					this._updateCurrentSeek();
				}).bind(this), (function(error) {
					this._setError(error);
				}).bind(this));
			}
		}).bind(this));
		
		this._fillInLastSeekOptions();
		
		this._user.LoggedIn.addHandler(function() {
			this._fillInLastSeekOptions();
		}, this);
		
		this._user.SeekMatched.addHandler(function() {
			this._updateCurrentSeek();
		}, this);
		
		this._user.SeekCreated.addHandler(function() {
			this._updateCurrentSeek();
		}, this);
		
		this._user.SeekExpired.addHandler(function() {
			this._updateCurrentSeek();
			
			if(this._timeoutAnimation) {
				this._timeoutAnimation.stop();
				this._timeoutAnimation = null;
			}
		}, this);
	}
	
	SeekForm.prototype._updateCurrentSeek = function() {
		var seek = this._user.getCurrentSeek();
		
		this._template.set("waiting", seek !== null);
		
		if(seek) {
			var expiryTime = seek.expiryTime;
			var timeLeft = expiryTime - this._server.getServerTime();
			var timeElapsed = jsonChessConstants.SEEK_TIMEOUT - timeLeft;
			var percentExpired = timeElapsed / (jsonChessConstants.SEEK_TIMEOUT / 100);
			
			this._template.set("percentExpired", percentExpired);
			
			this._timeoutAnimation = this._template.animate("percentExpired", 100, {
				duration: timeLeft
			});
		}
	}
	
	SeekForm.prototype._fillInLastSeekOptions = function() {
		var options = this._user.getLastSeekOptions();
		
		if(options !== null) {
			this._template.set("initialTime", Time.fromMilliseconds(options.initialTime).getUnitString(Time.minutes));
			this._template.set("timeIncrement", Time.fromMilliseconds(options.timeIncrement).getUnitString(Time.seconds));
			this._template.set("ratingMin", options.acceptRatingMin);
			this._template.set("ratingMax", options.acceptRatingMax);
		}
	}
	
	SeekForm.prototype._clearError = function() {
		this._template.set("error", "");
	}
	
	SeekForm.prototype._setError = function(message) {
		this._template.set("error", message);
		this._setClearErrorTimer();
	}
	
	SeekForm.prototype._setClearErrorTimer = function() {
		this._clearErrorTimer = setTimeout((function() {
			this._clearError();
			this._clearErrorTimer = null;
		}).bind(this), 10 * 1000);
	}
	
	SeekForm.prototype._clearClearErrorTimer = function() {
		if(this._clearErrorTimer !== null) {
			clearTimeout(this._clearErrorTimer);
			
			this._clearErrorTimer = null;
		}
	}
	
	return SeekForm;
});