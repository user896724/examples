define(function(require) {
	var Publisher = require("js/Publisher");
	var Promisor = require("js/Promisor");
	var time = require("js/time");
	var Event = require("js/Event");
	var id = require("js/id");
	
	function Server(url) {
		this._isConnected = false;
		this._callbacks = {};
		this._url = url;
		this._socket = null;
		this._publisher = new Publisher(this);
		this._promisor = new Promisor(this);
		this._serverTimeDifference = 0;
		
		this.Disconnected = new Event();
		this.Connected = new Event();
		
		this._timeLastMessageSent = 0;
		this._timeLastMessageReceived = 0;
		this._timeConnected = 0;
		this._heartbeatInterval = 1000;
		this._maxTimeBetweenMessages = 3000;
		this._heartbeatLoop = null;
		
		this._socketOpenHandler = (function(event) {
			this._isConnected = true;
			this._timeConnected = time();
			this._estimateServerTime();
			this.Connected.fire();
			this._promisor.resolve("/connect");
			
			if(this._heartbeatLoop === null) {
				this._heartbeatLoop = setInterval((function() {
					this._checkHeartbeat();
					this._sendHeartbeatMessage();
				}).bind(this), this._heartbeatInterval);
			}
		}).bind(this);
		
		this._socketMessageHandler = (function(event) {
			var message = JSON.parse(event.data);
			
			this._publisher.publish(message.topic, message.data);
			this._timeLastMessageReceived = time();
		}).bind(this);
		
		this._socketCloseHandler = (function(event) {
			if(this._isConnected) {
				this._isConnected = false;
				this._promisor.remove("/connect");
				this.Disconnected.fire();
			}
		}).bind(this);
		
		this.connect();
	}
	
	Server.prototype.subscribe = function(topic, callback) {
		this._publisher.subscribe(topic, callback);
	}
	
	Server.prototype.unsubscribe = function(topic, callback) {
		this._publisher.unsubscribe(topic, callback);
	}
	
	Server.prototype.emit = function(topic, data) {
		this.send(topic, data);
	}
	
	Server.prototype.on = function(topic, callback) {
		this.subscribe(topic, callback);
	}
	
	Server.prototype.send = function(topic, data) {
		if(this._socket !== null && this._socket.readyState === WebSocket.OPEN) {
			this._socket.send(JSON.stringify({
				topic: topic,
				data: data
			}));
			
			this._timeLastMessageSent = time();
		}
	}
	
	Server.prototype.disconnect = function() {
		this._closeSocket();
		clearInterval(this._heartbeatLoop);
		this._heartbeatLoop = null;
		this._socket = null;
		this._isConnected = false;
		this._timeConnected = 0;
		this._timeLastMessageReceived = 0;
		this._timeLastMessageSent = 0;
	}
	
	Server.prototype.connect = function() {
		this.disconnect();
		
		this._socket = new WebSocket(this._url);
		
		this._socket.addEventListener("open", this._socketOpenHandler);
		this._socket.addEventListener("message", this._socketMessageHandler);
		this._socket.addEventListener("close", this._socketCloseHandler);
	}
	
	Server.prototype.getConnection = function() {
		return this._promisor.get("/connect", function(promise) {
			if(this._isConnected) {
				promise.resolve();
			}
		});
	}
	
	Server.prototype._closeSocket = function() {
		if(this._socket !== null) {
			this._socket.removeEventListener("open", this._socketOpenHandler);
			this._socket.removeEventListener("message", this._socketMessageHandler);
			this._socket.removeEventListener("close", this._socketCloseHandler);
			this._socket.close();
		}
	}
	
	Server.prototype._checkHeartbeat = function() {
		if(time() - Math.max(this._timeConnected, this._timeLastMessageReceived) > this._maxTimeBetweenMessages) {
			this.connect();
		}
	}
	
	Server.prototype._sendHeartbeatMessage = function() {
		if(time() - Math.max(this._timeConnected, this._timeLastMessageSent) > this._heartbeatInterval) {
			this.send("/heartbeat");
		}
	}
	
	Server.prototype._estimateServerTime = function() {
		var requestId = id();
		var numberOfRequestsToSend = 3;
		var timeBetweenRequests = 500;
		var timeLastRequestSent;
		var recordedLatencies = [];
		
		this.subscribe("/time/" + requestId, (function(serverTime) {
			var now = time();
			var latency = now - timeLastRequestSent;
			
			recordedLatencies.push(latency);
			
			var averageLatency = recordedLatencies.reduce(function(total, current) {
				return total + current;
			}, 0) / recordedLatencies.length;
			
			var estimatedServerTime = serverTime + Math.round(averageLatency / 2);
			 
			this._serverTimeDifference = estimatedServerTime - now;
			
			if(recordedLatencies.length < numberOfRequestsToSend) {
				setTimeout(requestTime, timeBetweenRequests - latency);
			}
		}).bind(this));
		
		var requestTime = (function() {
			this.send("/request/time", requestId);
			
			timeLastRequestSent = time();
		}).bind(this);
		
		requestTime();
	}
	
	Server.prototype.getServerTime = function() {
		return time() + this._serverTimeDifference;
	}
	
	return Server;
});