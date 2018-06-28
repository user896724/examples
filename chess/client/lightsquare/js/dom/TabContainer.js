define(function(require) {
	var create = require("./create");
	
	function TabContainer(parent, tabClass) {
		this._container = parent;
		this._tabs = {};
		this._tabClass = tabClass || "";
		this._currentTab = null;
	}
	
	TabContainer.prototype.createTab = function(id) {
		if(!this.hasTab(id)) {
			var tab = create("div", this._container);
			
			tab.style.display = "none";
			tab.className = this._tabClass;
			
			this._tabs[id] = tab;
			
			return tab;
		}
		
		else {
			throw "TabContainer - tab with id " + id + " already exists";
		}
	}
	
	TabContainer.prototype.hasTab = function(id) {
		return (id in this._tabs);
	}
	
	TabContainer.prototype.changeId = function(oldId, newId) {
		this._tabs[newId] = this._tabs[oldId];
		
		delete this._tabs[oldId];
	}
	
	TabContainer.prototype.showTab = function(currentId) {
		if(this._currentTab) {
			this._currentTab.style.display = "none";
		}
		
		this._tabs[currentId].style.display = "";
		this._currentTab = this._tabs[currentId];
	}
	
	TabContainer.prototype.removeTab = function(id) {
		if(id in this._tabs) {
			this._container.removeChild(this._tabs[id]);
			
			if(this._currentTab === this._tabs[id]) {
				this._currentTab = null;
			}
			
			delete this._tabs[id];
		}
	}
	
	TabContainer.prototype.clear = function() {
		for(var id in this._tabs) {
			this.removeTab(id);
		}
		
		this._currentTab = null;
	}
	
	return TabContainer;
});