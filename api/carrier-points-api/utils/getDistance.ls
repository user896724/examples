EARTH_RADIUS = 6378137m

rad = (* Math.PI / 180)

module.exports = (p1, p2) ->
	dLat = rad p2.lat - p1.lat 
	dLong = rad p2.lng - p1.lng 
	a = Math.pow(Math.sin(dLat / 2), 2) + Math.cos(rad p1.lat) * Math.cos(rad p2.lat) * Math.pow(Math.sin(dLong / 2), 2)
	c = 2 * Math.atan2 Math.sqrt(a), Math.sqrt(1 - a)
	EARTH_RADIUS * c
