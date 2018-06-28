require! {
	request
	"uuid/v1": uuid
}

module.exports = (config) ->
	DAYS = <[ mon tue wed thu fri sat sun ]>
	preferredDepts = <[ KIOSK MANNED DRIVETHRU LOCKER ]>
	
	getOpeningTimes = (dept) ->
		DAYS.map -> [dept[it + "Hours"].replace /:/g "" .split "-"]
	
	format = (f) ->
		dept = null
		
		for type in preferredDepts
			if dept = f.depts.filter (.name == "TO_YOU_#{type}_RETURN") .0
				break
		
		if dept
			openingTimes = getOpeningTimes that
		
		carrier: "asda"
		carrierName: "ASDA"
		name: f.facilityName
		address: f.addressLine1
		city: f.city
		county: f.county
		postcode: f.postCode
		openingTimes: openingTimes
		disabledAccess: null
		lat: f.latitude
		lng: f.longitude
		miles: Math.round(f.distance * 10) / 10
	
	(location, callback) ->
		{lat, lng} = location
		
		request {
			url: config.url
			headers:
				clientId: config.clientId
				transactionId: uuid()
			qs:
				latitude: lat
				longitude: lng
				isCapacityChkRqrd: no
			rejectUnauthorized: no
		} <<< config.ssl, (e, res) ->
			facilities = try JSON.parse res.body .response.payload.records.0.facilities
			
			if facilities
				callback null (facilities.filter (.facilityisOperational && it.isToYouEnabled) .map format)
			else
				console.error "ASDA"
				console.error e
				error = try JSON.parse res.body .error
				console.error error
				callback new Error("ASDA API response malformed")
