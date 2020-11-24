// jwt.js

const jwt = require('express-jwt');
const jwksRsa = require('jwks-rsa');
const credentials = require('../confidential/credentials.js');

// For auth0
const CLIENT_ID = credentials.client_id;
const CLIENT_SECRET = credentials.client_secret;
const DOMAIN = credentials.domain;

module.exports.checkJwt = jwt({    
	secret: jwksRsa.expressJwtSecret({     
		cache: true,      
		rateLimit: true,      
		jwksRequestsPerMinute: 5,      
		jwksUri: `https://${DOMAIN}/.well-known/jwks.json`    
	}),    

	// Validate the audience and the issuer  
	issuer: `https://${DOMAIN}/`,    
	algorithms: ['RS256']
});
