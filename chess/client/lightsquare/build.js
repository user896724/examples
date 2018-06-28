({
	appDir: "./",
	dir: "../lightsquare-optimised",
	baseUrl: "./js",
	map: {
		"*": {
			"css": "require-css/css",
			"file": "require-text/text",
			"ready": "domReady/domReady"
		}
	},
	name: "lightsquare/main",
	skipDirOptimize: true,
	keepBuildDir: true
})