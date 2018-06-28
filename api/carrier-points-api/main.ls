require! {
	http
	express
	cors
	"./config"
	"prelude-ls": {Obj}
	"./api"
}

app = express()

app.use cors {
	origin: config.allowedOrigins
	optionsSuccessStatus: 200
}

function isNumber n
	typeof! n == "Number" && !isNaN n

app.get "/" (req, res) ->
	{postcode, carriers} = req.query
	location = {postcode}
	{lat, lng} = Obj.map parseFloat, req.query{lat, lng}
	
	if !carriers
		return res.json {
			error: "No carriers provided"
			results: []
		}
	
	if !postcode || !isNumber(lat) || !isNumber(lng)
		return res.json {
			error: "Postcode and lat/lng must be provided"
			results: []
		}
	
	carriers.=split ','
	
	location <<< {lat, lng}
	
	api carriers, location, (error, results) ->
		res.json {error, results}

http.Server app .listen config.port
