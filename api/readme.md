Carrier Points API
=====

This is a JSON endpoint for retrieving the nearest store locations for Collect+, ASDA ToYou, DPD and InPost.

ASDA and DPD require secrets for the test environments so I've disabled them for this demo.

Usage
-----

```
docker build -t carrier-points .
docker run --sig-proxy=false -p 8080:10003 carrier-points
```

The API will now be available at http://localhost:8080/ (or whichever port you pass to the `-p` option).

`--sig-proxy=false` enables exiting back to the terminal with Ctrl+C.

Calling
-------

The API accepts the following parameters in the query string (all required):

- `carriers` - a comma-separated list of one or more of:
	- `asda`
	- `collectplus`
	- `inpost`
	- `dpd`

- `postcode` - a valid UK postcode

- `lat`, `lng` - coordinates to search around

> Postcode and lat/lng are both required to satisfy the different underlying APIs; this could be made more flexible, but since this was a one-off project I decided to keep the backend very simple and use the already-loaded Maps API in the client to resolve the location search.

### Example:

`curl "http://localhost:8080/?carriers=collectplus,inpost&postcode=HU52SY&lat=53.7456709&lng=-0.3367412"`

### Response format:

```
{
  "error": null,
  "results": [
    {
      "carrier": "collectplus",
      "carrierName": "Collect+",
      "name": "Tesco Express",
      "address": "10-12 King Edward Street",
      "city": "Hull",
      "county": "North Humberside",
      "postcode": "HU1 3SS",
      "openingTimes": [
        [["0600", "2300"]],
        [["0600", "2300"]],
        [["0600", "2300"]],
        [["0600", "2300"]],
        [["0600", "2300"]],
        [["0600", "2300"]],
        [["0600", "2300"]]
      ],
      "disabledAccess": "Reasonable",
      "lat": 53.744499145228,
      "lng": -0.33981280428685,
      "miles": 0.1
    },
    // ...
  ]
}
```

The search location is specified by the postcode, lat and lng parameters.  The nearest 20 results are returned, ordered nearest-first.
