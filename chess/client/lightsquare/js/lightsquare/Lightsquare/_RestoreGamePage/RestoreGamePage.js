define(function(require) {
	require("css!./restore_game_page.css");
	var html = require("file!./restore_game_page.html");
	var RactiveI18n = require("ractive-i18n/RactiveI18n");
	var GameBackupList = require("./_GameBackupList/GameBackupList");
	
	function RestoreGamePage(user, server, parent) {
		this._template = new RactiveI18n({
			el: parent,
			template: html,
			data: {
				locale: user.getLocaleDictionary()
			}
		});
		
		this._backupList = new GameBackupList(user, server, this._template.nodes.backup_list);
	}
	
	RestoreGamePage.prototype.show = function() {
		this._backupList.refresh();
	}
	
	return RestoreGamePage;
});