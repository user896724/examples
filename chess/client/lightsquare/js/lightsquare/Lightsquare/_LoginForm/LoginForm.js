define(function(require) {
	require("css!./login_form.css");
	var html = require("file!./login_form.html");
	var RactiveI18n = require("ractive-i18n/RactiveI18n");
	
	function LoginForm(user, parent) {
		this._user = user;
		
		this._template = new RactiveI18n({
			el: parent,
			template: html,
			data: {
				locale: this._user.getLocaleDictionary(),
				error: "",
				username: "",
				password: ""
			}
		});
		
		this._clearErrorTimer = null;
		
		this._template.on("submit", (function(event) {
			event.original.preventDefault();
			
			this._clearError();
			this._clearClearErrorTimer();
			
			var username = this._template.get("username") + "";
			var password = this._template.get("password") + "";
			
			this._user.login(username, password).then((function() {
				this._clearForm();
			}).bind(this), (function(reason) {
				this._setError(reason);
			}).bind(this));
		}).bind(this));
	}
	
	LoginForm.prototype._clearForm = function() {
		this._template.set("username", "");
		this._template.set("password", "");
	}
	
	LoginForm.prototype._clearError = function() {
		this._template.set("error", "");
	}
	
	LoginForm.prototype._setError = function(message) {
		this._template.set("error", message);
		this._setClearErrorTimer();
	}
	
	LoginForm.prototype._setClearErrorTimer = function() {
		this._clearErrorTimer = setTimeout((function() {
			this._clearError();
			this._clearErrorTimer = null;
		}).bind(this), 10 * 1000);
	}
	
	LoginForm.prototype._clearClearErrorTimer = function() {
		if(this._clearErrorTimer !== null) {
			clearTimeout(this._clearErrorTimer);
			
			this._clearErrorTimer = null;
		}
	}
	
	return LoginForm;
});