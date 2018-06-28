require! {
	async
	"./carriers/collectplus"
	"./carriers/inpost"
	"./carriers/asda"
	"./carriers/dpd"
	"./utils/getDistance"
	"./config"
}

apis = {collectplus, inpost}

for k, createApi of apis
	apis[k] = createApi config[k]

maxResults = 20

module.exports = (carriers, location, done) ->
	nearest = (a, b) ->
		getDistance(a, location) - getDistance(b, location)

	requestedApis = carriers.map (apis.)
	
	async.concat requestedApis, (api, callback) ->
		api location, callback
	, (e, results) ->
		done e, results?sort(nearest)slice 0 maxResults
