define(function(require, exports, module) {
	var same = require("chai").assert.equal;
	var Time = require("../Time");
	var runTests = require("test-runner/runTests");
	require("./globalSquares");
	
	var tests = {
		"Time from empty string is 0 seconds":
		
		function() {
			same(Time.fromUnitString("").valueOf(), 0);
		},
		
		"fromUnitString() on '1m' is 60 seconds":
		
		function() {
			same(Time.fromUnitString("1m").valueOf(), 60000);
		},
		
		"fromUnitString() on '1h' is 3600 seconds":
		
		function() {
			same(Time.fromUnitString("1h").valueOf(), 3600000);
		},
		
		"fromUnitString() on 1h3m is 3780":
		
		function() {
			same(Time.fromUnitString("1h3m").valueOf(), 3780000);
		},
		
		"fromUnitString() with random whitespace is correct":
		
		function() {
			same(Time.fromUnitString("   1  h3   m").valueOf(), 3780000);
		},
		
		"fromUnitString() with random whitespace, capitalisation and other letters is correct":
		
		function() {
			same(Time.fromUnitString("   25  H3   minuTES and 45 s  ").valueOf(), 90225000);
		},
		
		"fromUnitString() with 1y is 31449600":
		
		function() {
			same(Time.fromUnitString("1y").valueOf(), 31449600000);
		},
		
		"fromUnitString() with 2y is 62899200":
		
		function() {
			same(Time.fromUnitString("2y").valueOf(), 62899200000);
		},
		
		"fromUnitString() with 2y 1s is 62899201":
		
		function() {
			same(Time.fromUnitString("2y 1s").valueOf(), 62899201000);
		},
		
		"getUnitString() with 10 and default units of minutes is '10s'":
		
		function() {
			same(Time.fromUnitString("10", Time.seconds).getUnitString(Time.minutes), "10s");
		},
		
		"getUnitString() with 100 and default units of minutes is '1m 40s'":
		
		function() {
			same(Time.fromMilliseconds(100000).getUnitString(Time.minutes), "1m 40s");
		},
		
		"getUnitString() with 600 and default units of minutes is '10'":
		
		function() {
			same(Time.fromMilliseconds(600000).getUnitString(Time.minutes), "10");
		},
		
		"getUnitString() with 600 and no default units is '10m'":
		
		function() {
			same(Time.fromMilliseconds(600000).getUnitString(), "10m");
		},
		
		"getUnitString() with 86400 and no default units is '1d'":
		
		function() {
			same(Time.fromMilliseconds(86400000).getUnitString(), "1d");
		},
		
		"getUnitString() with 86400 and default units 'd' is '1'":
		
		function() {
			same(Time.fromMilliseconds(86400000).getUnitString(Time.days), "1");
		},
		
		"getUnitString() with 86401 and default units 's' is '1d 1'":
		
		function() {
			same(Time.fromMilliseconds(86401000).getUnitString(Time.seconds), "1d 1");
		},
		
		"getColonDisplay with 1000 is 0:01":
		
		function() {
			same(Time.fromMilliseconds(1000).getColonDisplay(), "0:01");
		},
		
		"getColonDisplay with 60000 is 1:00":
		
		function() {
			same(Time.fromMilliseconds(60000).getColonDisplay(), "1:00");
		},
		
		"getColonDisplay with 86400000 is 1:00:00:00":
		
		function() {
			same(Time.fromMilliseconds(86400000).getColonDisplay(), "1:00:00:00");
		},
		
		"getColonDisplay with 172800000 is 2:00:00:00":
		
		function() {
			same(Time.fromMilliseconds(172800000).getColonDisplay(), "2:00:00:00");
		},
		
		"getColonDisplay with 172800999 is 2:00:00:00":
		
		function() {
			same(Time.fromMilliseconds(172800999).getColonDisplay(), "2:00:00:00");
		},
		
		"getColonDisplay with 172800999 and displayTenths is 2:00:00:00.9":
		
		function() {
			same(Time.fromMilliseconds(172800999).getColonDisplay(true), "2:00:00:00.9");
		},
		
		"getColonDisplay of negative 10 seconds is '-0:10'":
		
		function() {
			same(Time.fromMilliseconds(-10000).getColonDisplay(), "-0:10");
		},
		
		"getUnitString of negative 10 seconds is '-10s'":
		
		function() {
			same(Time.fromMilliseconds(-10000).getUnitString(), "-10s");
		}
	};
	
	runTests(module.id, tests);
});