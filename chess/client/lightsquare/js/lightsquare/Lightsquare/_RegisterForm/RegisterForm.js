define(function(require) {
	require("css!./register_form.css");
	var html = require("file!./register_form.html");
	var RactiveI18n = require("ractive-i18n/RactiveI18n");
	var Event = require("js/Event");
	
	function RegisterForm(user, parent) {
		this._user = user;
		
		this.Registered = new Event();
		
		this._template = new RactiveI18n({
			el: parent,
			template: html,
			data: {
				locale: this._user.getLocaleDictionary(),
				error: "",
				username: "",
				password: "",
				password_confirm: ""
			}
		});
		
		this._template.on("submit", (function(event) {
			event.original.preventDefault();
			
			this._template.set("error", null);
			
			var username = this._template.get("username") + "";
			var password = this._template.get("password") + "";
			var password_confirm = this._template.get("password_confirm") + "";
			
			if(password_confirm.length > 0 && password !== password_confirm) {
				this._template.set("error", "Password confirmation supplied and doesn't match password");
			}
			
			else {
				this._user.register(username, password).then((function(loggedIn) {
					this.reset();
					
					this.Registered.fire({
						loggedIn: loggedIn,
						registeredUsername: username
					});
				}).bind(this), (function(error) {
					this._template.set("error", error);
				}).bind(this));
			}
		}).bind(this));
	}
	
	RegisterForm.prototype.reset = function() {
		this._template.set("username", "");
		this._template.set("password", "");
		this._template.set("password_confirm", "");
		this._template.set("error", null);
	}
	
	RegisterForm.prototype.focus = function() {
		this._template.nodes.register_username.focus();
	}
	
	return RegisterForm;
});