define(function(require) {
	var time = require("js/time");
	
	function GameBackups(db) {
		this._db = db;
		
		if(!this._db.get("gameBackups")) {
			this._db.set("gameBackups", {});
		}
	}
	
	GameBackups._MAX_AGE = 1000 * 60 * 60 * 24;
	
	GameBackups.prototype.getBackups = function() {
		return this._db.get("gameBackups");
	}
	
	GameBackups.prototype.cleanupOldBackups = function() {
		this._filter(function(backup) {
			return (backup.expiryTime === null || time() < backup.expiryTime);
		});
	}
	
	GameBackups.prototype.markForCleanup = function() {
		this._filter(function(backup) {
			if(backup.expiryTime === null) {
				backup.expiryTime = time() + GameBackups._MAX_AGE;
			}
		});
	}
	
	GameBackups.prototype._filter = function(callback) {
		var backups = this._db.get("gameBackups");
		
		for(var id in backups) {
			if(callback(backups[id]) === false) {
				delete backups[id];
			}
		}
		
		this._db.set("gameBackups", backups);
	}
	
	GameBackups.prototype.save = function(game) {
		var gameDetails = game.getBackupDetails();
		var id = gameDetails.id;
		var backups = this._db.get("gameBackups");
		var backup;
		var playingAs = game.getUserColour();
		
		if(id in backups) {
			backup = backups[id];
			backup.gameDetails = gameDetails;
			backup.expiryTime = null;
		}
		
		else {
			backup = {
				expiryTime: null,
				gameDetails: gameDetails,
				opponent: {
					name: game.getPlayerName(playingAs.opposite),
					rating: game.getRating(playingAs.opposite)
				},
				timingDescription: game.timingStyle.getDescription(),
				playingAs: playingAs.fenString
			};
		}
		
		backups[id] = backup;
		
		this._db.set("gameBackups", backups);
	}
	
	GameBackups.prototype.remove = function(id) {
		var backups = this._db.get("gameBackups");
		
		delete backups[id];
		
		this._db.set("gameBackups", backups);
	}
	
	return GameBackups;
});