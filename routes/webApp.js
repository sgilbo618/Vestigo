// webApp.js

const express = require('express');
const fetch = require('node-fetch');
const { URLSearchParams } = require('url');
const session = require('express-session');
const bodyParser = require('body-parser');
const crypto = require("crypto");
const jwtDecode = require("jwt-decode");
const credentials = require('../confidential/credentials.js');
const consts = require('../helpers/constants.js');
const uh = require('../helpers/user_helpers.js');
const mf = require('../helpers/model_functions.js');

const router = express.Router();

//app.use(express.static('public'));

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended: false}));


router.use(session({
	secret: credentials.sessionSecret,
	resave: true,
	saveUninitialized: true
}));


const CLIENT_ID = credentials.client_id;
const CLIENT_SECRET = credentials.client_secret;
const DOMAIN = credentials.domain;
const USER = consts.USER;


/*
** Home Page - displays welcome and log in form
*/
router.get('/', function(req, res){
	// Check for error message to send to home page
	let info = {};
	if (req.query.error){
		info.error = req.query.error + " Please try again.";
	}
	res.render('home', info);
});


/*
** Login Post - takes user log in info, authenticates with auth0, reroutes
** to user info page.
*/
router.post('/login', function(req,res){
	const username = req.body.email;
	const password = req.body.password;

	let body = {
			grant_type: 'password',
			username: username,
			password: password,
			client_id: CLIENT_ID,
			client_secret: CLIENT_SECRET
		}

	fetch(`https://${DOMAIN}/oauth/token`, {
		method: 'post',
		body: JSON.stringify(body),
		headers: { 'Content-Type': 'application/json'}
	})
	.then(res => res.json())
	.then(json => {
		let info = {};

		// Redirect unauthorized users back to login
		if (json.error){
			res.redirect('/?error=' + json.error_description);
			return;
		}

		// Get user and jwt info to send to user info
		let decodedJwt = jwtDecode(json.id_token);
		info.jwt = json.id_token;

		const user = uh.get_user_by_sub(USER, decodedJwt.sub)
		.then((user) => {

			info.id = user[0].id;
			info.name = user[0].name;
			res.render('userinfo', info);
		})
		.catch((err) => { console.log(err) });
	})
	.catch(e => console.log(e));
});


/*
** Sign Up Page - displays form to create account
*/
router.get('/signup', function(req, res){
	res.render('signup');
});


/*
** Register Post - takes user entries and creates a new account with auth0.
** Then uses those credentials to get a jwt, redirects new user to user info.
*/
router.post('/register', function(req,res){

	// Get form data
	const username = req.body.email;
	const password = req.body.password;

	// Build body to create user
	let body = {
			connection: 'Username-Password-Authentication',
			username: username,
			password: password,
			client_id: CLIENT_ID,
			email: username
		}

	// Create user using form data and auth token for client
	fetch(`https://${DOMAIN}/dbconnections/signup`, {
		method: 'POST',
		body: JSON.stringify(body),
		headers: { 'Content-Type': 'application/json' }
	})
	.then(res => res.json())
	.then(json => {

		// Build body to get jwt
		let body_jwt = {
			grant_type: 'password',
			username: username,
			password: password,
			client_id: CLIENT_ID,
			client_secret: CLIENT_SECRET
		}

		// Get jwt for this user
		fetch(`https://${DOMAIN}/oauth/token`, {
			method: 'post',
			body: JSON.stringify(body_jwt),
			headers: { 'Content-Type': 'application/json'}
		})
		.then(res => res.json())
		.then(json => {

			// Display jwt to user
			let info = {};

			// Redirect unauthorized users back to login
			if (json.error){
				res.redirect('/?error=' + json.error_description);
				return;
			}

			// Get user info and jwt to send to user info page
			let decodedJwt = jwtDecode(json.id_token);
			info.jwt = json.id_token;

			// Create new user for datastore
			const new_user = uh.build_user(decodedJwt);
			mf.post_entity(USER, new_user)
			.then((key) => {
				
				info.id = key.id;
				info.name = new_user.name;
				res.render('userinfo', info)
			})
			.catch((err) => { console.log(err) });
		})
		.catch(e => console.log(e));
	})
	.catch(e => console.log(e));		
});


// error routes
router.use(function(req,res){
	res.status(404);
	res.render('404');
});

router.use(function(err, req, res, next){
	res.type('plain/text');
	res.status(500);
	res.render('500');
});


module.exports = router;