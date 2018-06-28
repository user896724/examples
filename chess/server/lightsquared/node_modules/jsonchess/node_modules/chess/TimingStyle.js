define(function(require) {
	var Time = require("./Time");
	
	function TimingStyle(options) {
		this.initialTime = 1000 * 60 * 10;
		this.increment = 0;
		this.isOvertime = false;
		this.overtimeFullmove = 40;
		this.overtimeBonus = 1000 * 60 * 10;
		this.firstTimedMoveIndex = 2;
		this.initialDelay = 0;
		
		for(var p in options) {
			this[p] = options[p];
		}
	}
	
	TimingStyle.prototype.getDescription = function() {
		var description;
		var initialTime = Time.fromMilliseconds(this.initialTime);
		var increment = Time.fromMilliseconds(this.increment);

		if(this.increment > 0) {
			description = initialTime.getUnitString(Time.minutes)
				+ " | "
				+ increment.getUnitString(Time.seconds);
		}
		
		else {
			description = initialTime.getUnitString();
		}
		
		if(this.isOvertime) {
			description += " + " + Time.fromMilliseconds(this.overtimeBonus).getUnitString(Time.minutes) + " @ move " + this.overtimeFullmove;
		}

		return description;
	}
	
	return TimingStyle;
});