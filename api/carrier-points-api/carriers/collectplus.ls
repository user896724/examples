require! {
	soap
	"../vendor/GridRef"
}

module.exports = (config) ->
	POSTCODE = 2
	DAYS = <[ Mon Tues Wednes Thurs Fri Satur Sun ]>
	TIME = /^\d{4}$/
	api = null
	
	function getApi callback
		if api
			callback that
		else
			soap.createClient config.url, (e, client) ->
				api := client
				callback client
	
	format = (point) ->
		gridRef = GridRef point.GridX, point.GridY
		latLng = GridRef.osGridToLatLon(gridRef){lat, lng: lon}
		
		carrier: 'collectplus'
		carrierName: "Collect+"
		name: point.SiteName
		address: point.Address
		city: point.City
		county: point.County
		postcode: point.Postcode
		openingTimes: DAYS.map ->
			[open, close] = [point["#{it}dayOpen"], point["#{it}dayClose"]]
			
			if open && close && open != close && open.match(TIME) && close.match(TIME)
				[[open, close]]
			else
				[]
		disabledAccess: point.DisabledAccessCode
		lat: latLng.lat
		lng: latLng.lng
		miles: Math.round(point.Miles * 10) / 10
	
	(location, callback) ->
		getApi (api) ->
			if api
				api.GetNearestAgentsType1Async {
					searchCriteria: location.postcode
					searchType: POSTCODE
					maxRecords: 20
				} .then (result) ->
					points = result?GetNearestAgentsType1Result?Agents?Agent
					
					if points
						callback null points.map format
					else
						callback new Error("Collect+ API response malformed")
				, (e) ->
					callback e
			else
				callback new Error("Collect+ API unavailable")
