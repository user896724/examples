require! {
	request
	"../utils/getDistance"
}

module.exports = (config) ->
	MILES_PER_M = 0.0006213712
	FILTER_RADIUS = 5 / MILES_PER_M
	DOWNLOAD_INTERVAL = 24 * 60 * 60 * 1000
	
	format = (location, point) -->
		[lat, lng] = point.location
		
		{street, city, post_code, building_no, province} = point.address
		
		carrier: 'inpost'
		carrierName: 'InPost'
		name: building_no
		address: street
		city: city
		county: province
		postcode: post_code
		openingTimes: [[['0000' '2359']] for from 1 to 7]
		disabledAccess: 'No'
		lat: lat
		lng: lng
		miles: (getDistance(location, {lat, lng}) * MILES_PER_M).toFixed 1
		locationId: point.id
	
	machines = []
	
	downloadMachines = ->
		console.log 'Downloading InPost machines at ' + new Date
		
		request config.url, (e, res, body) ->
			try
				machines := JSON.parse body ._embedded.machines
			catch e
				console.error 'Failed to get InPost machines'
				console.error e
				console.error res
				console.error body
	
	setInterval downloadMachines, DOWNLOAD_INTERVAL
	
	downloadMachines()
	
	(location, callback) ->
		callback null (machines.filter (m) ->
			[lat, lng] = m.location
			getDistance(location, {lat, lng}) < FILTER_RADIUS
		).map format location
