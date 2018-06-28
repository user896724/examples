define(function(require) {
	require("Array.prototype/empty");
	require("css!./base.css");
	require("css!./lightsquare.css");
	require("css!./forms.css");
	require("css!./games_list.css");
	require("css!./connecting_message.css");
	require("css!./top_bar.css");
	require("css!./login.css");
	require("css!./register.css");
	require("css!./logout_confirmation.css");
	require("css!./player_clocks.css");
	require("css!./chrome_scrollbars.css");
	var html = require("file!./lightsquare.html");
	var connectingMessageHtml = require("file!./connecting_message.html");
	var Router = require("routing/Router");
	var AddressBarPath = require("routing/AddressBarPath");
	var TabContainer = require("dom/TabContainer");
	var Colour = require("chess/Colour");
	var Time = require("chess/Time");
	var LoginForm = require("./_LoginForm/LoginForm");
	var RegisterForm = require("./_RegisterForm/RegisterForm");
	var HomePage = require("./_HomePage/HomePage");
	var GamePage = require("./_GamePage/GamePage");
	var SpectatePage = require("./_SpectatePage/SpectatePage");
	var RestoreGamePage = require("./_RestoreGamePage/RestoreGamePage");
	var TournamentsPage = require("./_TournamentsPage/TournamentsPage");
	var RandomGames = require("lightsquare/RandomGames");
	var ListFeed = require("lightsquare/ListFeed");
	var RactiveI18n = require("ractive-i18n/RactiveI18n");
	var locales = require("lightsquare/locales");
	
	var LEFT_BUTTON = 0;
	var ESCAPE_KEY = 27;
	
	function Lightsquare(user, server, parent) {
		this._user = user;
		this._server = server;
		this._router = new Router(new AddressBarPath());
		this._seekList = new ListFeed(this._server, "seeks");
		
		this._setupTemplate(parent);
		this._setupRouter();
		this._setupUser();
		this._handleServerEvents();
		
		this._setupLoginForm();
		this._setupLogoutLink();
		this._setupRegisterForm();
		this._setupOverlayHandlers();
		
		this._pages = {};
		this._gamePages = [];
		this._gamePageIndex = {};
		this._currentPage = null;
		
		this._tabContainer = new TabContainer(this._template.nodes.tabs, "page");
		
		setInterval(this._updateClocks.bind(this), 100);
	}
	
	Lightsquare.prototype._addGamePage = function(game) {
		var id = game.id;
		var url = "/game/" + id;
		
		if(!this._hasPage(url)) {
			var page = new GamePage(game, this._user, this._server, this._createPage(url));
			
			var index = this._gamePages.length;
			
			for(var i = 0; i < this._gamePages.length; i++) {
				if(game.startTime >= this._gamePages[i].getStartTime()) {
					index = i;
					
					break;
				}
			}
			
			this._gamePages.splice(index, 0, page);
			this._updateGamePageIndex();
			this._updateGamePages();
			this._template.set("hasGames", true);
			this._pages[url] = page;
			
			page.Rematch.addHandler(function(game) {
				var newId = game.id;
				var newUrl = "/game/" + newId;
				
				this._tabContainer.changeId(url, newUrl);
				delete this._pages[url];
				this._pages[newUrl] = page;
				this._gamePageIndex[newId] = this._gamePageIndex[id];
				
				if(this._router.getPath() === url) {
					this._router.setPath(newUrl);
				}
				
				this._updateGamePage(page);
				
				url = newUrl;
				id = newId;
			}, this);
			
			page.Move.addHandler(function() {
				this._updateGamePage(page);
			}, this);
			
			page.GameOver.addHandler(function() {
				this._updateGamePage(page);
			}, this);
			
			page.Aborted.addHandler(function() {
				this._updateGamePage(page);
			}, this);
		}
	}
	
	Lightsquare.prototype._updateGamePage = function(page) {
		var id = page.getId();
		
		var data = {
			href: "/game/" + id,
			userIsPlaying: page.userIsPlaying(),
			userIsActivePlayer: page.userIsActivePlayer(),
			white: page.getPlayerName(Colour.white),
			black: page.getPlayerName(Colour.black),
			timingStyle: page.getTimingStyle().getDescription(),
			isInProgress: page.gameIsInProgress()
		};
		
		if(page.userIsPlaying()) {
			var colour = page.getUserColour();
			
			data.opponent = page.getPlayerName(colour.opposite);
			data.playerTime = page.getTimeLeft(colour);
		}
		
		this._template.set("gamePages." + this._gamePageIndex[id], data);
	}
	
	Lightsquare.prototype._updateGamePages = function() {
		this._gamePages.forEach((function(page) {
			this._updateGamePage(page);
		}).bind(this));
	}
	
	Lightsquare.prototype._updateGamePageIndex = function() {
		this._gamePages.forEach(function(page, index) {
			this._gamePageIndex[page.getId()] = index;
		}, this);
	}
	
	Lightsquare.prototype._clearGamePages = function() {
		for(var id in this._gamePageIndex) {
			var url = "/game/" + id;
			
			if(this._pages[url] === this._currentPage) {
				this._currentPage = null;
			}
			
			delete this._pages[url];
		}
		
		this._gamePages = [];
		this._gamePageIndex = {};
		this._template.set("gamePages", []);
		this._template.set("hasGames", false);
	}
	
	Lightsquare.prototype._updateClocks = function() {
		this._gamePages.forEach((function(page) {
			if(page.userIsPlaying() && page.gameIsInProgress()) {
				this._template.set(
					"gamePages." + this._gamePageIndex[page.getId()] + ".playerTime",
					page.getTimeLeft(page.getUserColour())
				);
			}
		}).bind(this));
	}
	
	Lightsquare.prototype._addGamePages = function() {
		this._user.getGames().then((function(games) {
			games.forEach((function(game) {
				this._addGamePage(game);
			}).bind(this));
		}).bind(this));
	}
	
	Lightsquare.prototype._hasPage = function(url) {
		return this._tabContainer.hasTab(url);
	}
	
	Lightsquare.prototype._showPage = function(url) {
		var page = this._pages[url];
		
		if(this._currentPage !== null && this._currentPage !== page && this._currentPage.hide) {
			this._currentPage.hide();
		}
		
		this._tabContainer.showTab(url);
		
		if(this._currentPage !== page && page.show) {
			page.show();
		}
		
		this._currentPage = page;
	}
	
	Lightsquare.prototype._createPage = function(url) {
		return this._tabContainer.createTab(url);
	}
	
	Lightsquare.prototype._updateUserDetails = function() {
		this._template.set({
			username: this._user.getUsername(),
			userIsLoggedIn: this._user.isLoggedIn()
		});
		
		this._updateGamePages();
	}
	
	Lightsquare.prototype._setupUser = function() {
		this._server.Connected.addHandler(function() {
			this._user.getDetails().then((function() {
				this._updateUserDetails();
			}).bind(this));
		}, this);
		
		this._user.LoggedIn.addHandler(function() {
			this._addGamePages();
			this._updateUserDetails();
			this._hideDialog("login");
		}, this);
		
		this._user.LoggedOut.addHandler(function() {
			this._updateUserDetails();
		}, this);
		
		this._user.SeekMatched.addHandler(function(game) {
			this._router.setPath("/game/" + game.id);
		}, this);
		
		this._user.GameRestored.addHandler(function(game) {
			this._router.setPath("/game/" + game.id);
		}, this);
	}
	
	Lightsquare.prototype._handleServerEvents = function() {
		this._server.Connected.addHandler(function() {
			this._user.getDetails().then((function() {
				this._initialise();
				this._router.execute();
				
				this._template.set({
					serverConnected: true,
					waitingForServer: false
				});
			}).bind(this));
		}, this);
		
		this._server.Disconnected.addHandler(function() {
			this._template.set("serverConnected", false);
		}, this);
	}
	
	Lightsquare.prototype._setupRouter = function() {
		this._router.PathChanged.addHandler(function(path) {
			this._template.set("currentPath", path);
		}, this);
		
		this._router.addRoute("/", (function(params, url) {
			if(!this._hasPage(url)) {
				this._pages[url] = new HomePage(this._user, this._server, this._createPage(url));
			}
			
			this._showPage(url);
		}).bind(this));
		
		this._router.addRoute("/game/:id", (function(params, url) {
			if(this._hasPage(url)) {
				this._showPage(url);
			}
			
			else {
				this._template.set("loadingGame", true);
				this._template.set("loadingGameId", params.id);
				
				this._user.getGame(params.id).then((function(game) {
					if(!this._hasPage(url)) {
						this._addGamePage(game);
					}
					
					this._showPage(url);
				}).bind(this), (function() {
					this._router.setPath("/");
				}).bind(this), (function() {
					this._template.set("loadingGame", false);
				}).bind(this));
			}
		}).bind(this));
		
		this._router.addRoute("/stockfish", (function(params, url) {
			if(!this._hasPage(url)) {
				this._pages[url] = new HomePage(this._user, this._server, this._createPage(url));
			}
			
			this._showPage(url);
			
			this._server.getConnection().then((function() {
				this._seekList.startUpdating();
				
				var accepted = this._autoAcceptStockfish();
				
				if(!accepted) {
					this._seekList.Updated.addHandler(function() {
						if(!accepted) {
							accepted = this._autoAcceptStockfish();
						}
					}, this);
				}
			}).bind(this));
		}).bind(this));
		
		this._router.addRoute("/games", (function(params, url) {
			if(!this._hasPage(url)) {
				this._pages[url] = new SpectatePage(
					new RandomGames(this._server),
					this._router,
					this._createPage(url)
				);
			}
			
			this._showPage(url);
		}).bind(this));
		
		this._router.addRoute("/tournaments", (function(params, url) {
			if(!this._hasPage(url)) {
				this._pages[url] = new TournamentsPage(this._user, this._server, this._createPage(url));
			}
			
			this._showPage(url);
		}).bind(this));
		
		this._router.addRoute("/restore-game", (function(params, url) {
			if(!this._hasPage(url)) {
				this._pages[url] = new RestoreGamePage(this._user, this._server, this._createPage(url));
			}
			
			this._showPage(url);
		}).bind(this));
	}
	
	Lightsquare.prototype._autoAcceptStockfish = function() {
		return this._seekList.getItems().some(function(seek) {
			if(!seek.owner.isUser) {
				this._user.acceptSeek(seek.id);
				
				return true;
			}
		}, this);
	}
	
	Lightsquare.prototype._setupTemplate = function(parent) {
		var path = this._router.getPath();
		var timeCriticalThreshold = Time.fromUnitString("10s");
		
		this._template = new RactiveI18n({
			el: parent,
			template: html,
			data: {
				selectedLocale: this._user.getLocale(),
				locales: locales,
				locale: this._user.getLocaleDictionary(),
				gamePages: [],
				hasGames: false,
				timeCriticalThreshold: timeCriticalThreshold,
				serverConnected: false,
				waitingForServer: true,
				dialog: null,
				showLogoutConfirmation: false,
				currentPath: path,
				navLinks: {
					home: [
						{
							href: "/",
							label: "Home"
						},
						{
							href: "/games",
							label: "Watch games"
						}/*,
						{
							href: "/tournaments",
							label: "Tournaments"
						}*/
					],
					tools: [
						{
							href: "/restore-game",
							label: "Restore game"
						}
					]
				},
				getHref: (function(path) {
					return this._router.getAbsolutePath(path);
				}).bind(this),
				getAbsolutePath: function(path) {
					return require.toUrl(path);
				},
				getColonDisplay: function(time) {
					return Time.fromMilliseconds(time).getColonDisplay(time < timeCriticalThreshold);
				},
				registered: false
			},
			partials: {
				connectingMessage: connectingMessageHtml
			}
		});
		
		this._template.observe("selectedLocale", (function(locale) {
			document.location.href = "?locale=" + locale;
		}).bind(this), {
			init: false
		});
		
		this._template.on("navigate", (function(event) {
			if(event.original.button === LEFT_BUTTON) {
				event.original.preventDefault();
			
				var path = this._router.getRelativePath(event.node.getAttribute("href"));
				
				if(path) {
					this._router.setPath(path);
				}
			}
		}).bind(this));
		
		setTimeout((function() {
			this._template.set("waitingForServer", false);
		}).bind(this), 3000);
	}
	
	Lightsquare.prototype._setupOverlayHandlers = function() {
		var foregroundClicked = false;
		
		this._template.on("background_click", (function() {
			if(!foregroundClicked) {
				this._hideOverlays();
			}
			
			foregroundClicked = false;
		}).bind(this));
		
		this._template.on("foreground_click", (function() {
			foregroundClicked = true;
		}).bind(this));
		
		window.addEventListener("keyup", (function(event) {
			if(event.keyCode === ESCAPE_KEY) {
				this._hideOverlays();
			}
		}).bind(this));
	}
	
	Lightsquare.prototype._hideOverlays = function() {
		this._hideDialog();
		this._template.set("showLogoutConfirmation", false);
	}
	
	Lightsquare.prototype._showDialog = function(dialog) {
		this._template.set("dialog", dialog);
	}
	
	Lightsquare.prototype._hideDialog = function(dialog) {
		if(!dialog || this._template.get("dialog") === dialog) {
			this._template.set("dialog", null);
		}
	}
	
	Lightsquare.prototype._setupLoginForm = function() {
		new LoginForm(this._user, this._template.nodes.login_form);
		
		this._template.on("login", (function() {
			this._showDialog("login");
		}).bind(this));
	}
	
	Lightsquare.prototype._setupRegisterForm = function() {
		var registerForm = new RegisterForm(this._user, this._template.nodes.register_form);
		
		registerForm.Registered.addHandler(function(data) {
			this._template.set({
				registered: true,
				registerAutoLoggedIn: data.loggedIn,
				registeredUsername: data.registeredUsername
			});
		}, this);
		
		this._template.on("register", (function() {
			this._showDialog("register");
			
			registerForm.reset();
			registerForm.focus();
		}).bind(this));
		
		this._template.on("register_done", (function() {
			this._hideDialog();
			this._template.set("registered", false);
		}).bind(this));
	}
	
	Lightsquare.prototype._setupLogoutLink = function() {
		this._template.on("logout", (function() {
			if(this._user.hasGamesInProgress()) {
				this._template.set("showLogoutConfirmation", true);
			}
			
			else {
				this._user.logout();
			}
		}).bind(this));
		
		this._template.on("logout_confirm", (function() {
			this._user.logout();
			this._template.set("showLogoutConfirmation", false);
		}).bind(this));
		
		this._template.on("logout_cancel", (function() {
			this._template.set("showLogoutConfirmation", false);
		}).bind(this));
	}
		
	Lightsquare.prototype._initialise = function() {
		this._tabContainer.clear();
		this._clearGamePages();
		this._addGamePages();
		this._updateUserDetails();
		this._template.set("dialog",  null);
	}
	
	return Lightsquare;
});