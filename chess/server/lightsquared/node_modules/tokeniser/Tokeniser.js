define(function(require) {
	function Tokeniser(string) {
		this._characters = string.split("");
	}
	
	Tokeniser.prototype.skipUntilMatches = function(regex) {
		while(!this._matches(regex) && !this.isEof()) {
			this._read();
		}
	}
	
	Tokeniser.prototype.readWhileMatches = function(regex) {
		var token = "";
		
		while(this._matches(regex)) {
			token += this._read();
		}
		
		return token;
	}
	
	Tokeniser.prototype.isEof = function() {
		return (this._characters.length === 0);
	}
	
	Tokeniser.prototype._read = function() {
		return (this._characters.shift() || "");
	}
	
	Tokeniser.prototype._matches = function(regex) {
		return (!this.isEof() && regex.test(this._characters[0]));
	}
	
	return Tokeniser;
});