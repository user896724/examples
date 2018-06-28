require! {
	fs
}

module.exports =
	#asda:
	#	clientId: '...'
	#	url: 'https://api.toyou.co.uk:2021/services/v1/retrieveAvailableStoresWithEDD'
	#	ssl:
	#		cert: fs.readFileSync "#__dirname/ssl/clicksit.crt"
	#		key: fs.readFileSync "#__dirname/ssl/clicksit.key"
	#		ca: fs.readFileSync "#__dirname/ssl/bundle-g2-g1.crt"
	dpd:
		loginUrl: 'https://api.dpd.co.uk/user/?action=login'
		url: 'https://api.dpdgroup.co.uk/organisation/pickuplocation/'
		user: '...'
		pass: '...'
		geoClient: 'account/...'
	inpost:
		url: 'https://api-uk.easypack24.net/v4/machines'
	collectplus:
		url: 'http://locator.paypoint.com:61001/AgentLocator.asmx?WSDL'
	port: 10003
	allowedOrigins: ["*"]
