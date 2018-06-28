const http = require("http")

const urls = [
    "http://hogg-blake.uk/test1.json",
    "http://hogg-blake.uk/test2.json",
    "http://hogg-blake.uk/test3.json",
    //"http://hogg-blake.uk/404.json",
    //"http://hogg-blake.uk/malformed.json"
]

/*
Utility functions - these would be in separate modules/third party libraries; I've put them here for simplicity and demonstration.
*/

function asyncMap (items, process) {
    return Promise.all(items.map ((item) => {
        return process(item)
    }))
}

function getJson (url) {
    return new Promise((resolve, reject) => {
        function logAndReject (error) {
            console.error(`Failed to fetch JSON from ${url}:`)
            console.error(error)
            reject(error)
        }
        
        try {
            http.get(url, (res, x) => {
                const {statusCode} = res
                const contentType = res.headers["content-type"]
                var error
                
                if (statusCode !== 200) {
                    error = new Error("Request failed: " + statusCode)
                }
                
                if (error) {
                    res.resume()
                    return logAndReject(error)
                }
                
                let body = ""
                
                res.setEncoding("utf8")
                
                res.on("error", (error) => {
                    logAndReject(error)
                })
                
                res.on("data", (chunk) => {
                    body += chunk
                })
                
                res.on("end", () => {
                    try {
                        result = JSON.parse(body)
                        
                        console.log(`Successfully fetched JSON from ${url}:`)
                        console.log(result)
                        
                        resolve(result)
                    } catch (error) {
                        logAndReject(error)
                    }
                })
            })
        } catch (error) {
            logAndReject(error)
        }
    })
}

asyncMap(urls, (url) => {
    return getJson(url)
}).then((results) => {
    console.log(results) // An array of the returned JSON values
}, (error) => {
    console.log(error) // the Error returned by the first promise to reject, if any
})
