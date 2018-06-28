require! {
	request
}

module.exports = (config) ->
	TIME = /^\d\d:\d\d$/
	
	headers = ->
		Accept: 'application/json'
		geoClient: config.geoClient
	
	format = (result) ->
		point = result.pickupLocation
		{address} = point
		opening = point.pickupLocationAvailability.pickupLocationOpenWindow
		
		openingTimes = [[] for from 1 to 7]
		
		opening.forEach (d) ->
			i = d.pickupLocationOpenWindowDay - 1
			
			[o, c] = [d.pickupLocationOpenWindowStartTime, d.pickupLocationOpenWindowEndTime]
			
			if o && c && o != c && o.match(TIME) && c.match(TIME)
				openingTimes[i].push [o, c].map (.replace ":" "")
		
		# dpd has e.g. [0600, 1200], [1200, 2000] so we simplify it to [0600, 2000]
		for d in openingTimes
			for t, i in d
				if d[i + 1] && t[1] == d[i + 1][0]
					d[i] = null
					d[i + 1] = [t[0], d[i + 1][1]]
		
		# strip out any nulls added by the simplification above
		openingTimes.=map (.filter -> it)
		
		carrier: 'dpd'
		carrierName: 'DPD'
		name: point.address.organisation
		address: address.street
		city: address.town
		county: address.county
		postcode: address.postcode
		openingTimes: openingTimes
		disabledAccess: if point.disabledAccess then 'Yes' else 'No'
		lat: point.addressPoint.latitude
		lng: point.addressPoint.longitude
		miles: result.distance.toFixed 1
	
	geoSession = null
	
	login = (callback) ->
		if geoSession
			callback that
		else
			token = Buffer.from "#{config.user}:#{config.pass}" .toString 'base64'
			
			request.post config.loginUrl, {
				headers: headers() <<< {
					Authorization: "Basic #token"
					'Content-Type': 'application/json'
				}
			} (e, res, body) ->
				if e
					console.error "DPD login failed"
					console.error e
					
					callback e
				else
					data = try JSON.parse body
					session = data?data?geoSession
					
					if session
						callback null that
					else
						console.error "DPD login failed"
						console.error res
						console.error body
						
						callback new Error("DPD unable to log in")
	
	callApi = (location, geoSession, reloginAttempts, callback) ->
		request.get config.url, {
			headers: headers() <<< {
				GEOSession: geoSession
			}
			qs:
				filter: 'byLatLong'
				latitude: location.lat
				longitude: location.lng
				searchPageSize: 20
				searchPage: 1
				maxDistance: 10
		} (e, res, body) ->
			data = try JSON.parse body
			
			if data?data?results
				callback null that.map format
			else
				if reloginAttempts == 0
					login (e, geoSession) ->
						if geoSession
							callApi location, that, 1, callback
						else
							callback new Error("DPD API error")
				else
					console.error "DPD API call error"
					console.error e
					console.error res
					console.error body
					
					callback new Error("DPD API error")
	
	(location, callback) ->
		login (e, geoSession) ->
			if e
				console.error "DPD API unavailable"
				console.error e
				
				callback new Error("DPD API unavailable")
			else
				callApi location, geoSession, 0, callback
