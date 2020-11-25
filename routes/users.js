const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();
const mf = require('../helpers/model_functions.js');
const userHelpers = require('../helpers/user_helpers.js');


// Define constants
const consts = require('../helpers/constants');
const USER = consts.USER;
const USERS_URL = consts.USERS_URL;

router.use(bodyParser.json());

// View a user
router.get('/:id', function(req, res, next){
    const user = mf.get_an_entity(USER, req.params.id)
    .then( (user) => {
        // See if user exists
        if (!user[0]) {
            return next(userHelpers.get_error(404));
        }

        // Add self
        user[0]["self"] = USERS_URL + '/' + user[0]["id"];

        const accepts = req.accepts(["application/json"]);
        
        // Make sure accept MIME is supported
        if (!accepts) {
            return next(get_error(415));

        // Return JSON
        } else if (accepts === "application/json") {
            res.status(200).json(user[0]);

        // Error
        } else {
            res.status(500).send("Content type got messed up");
        }
    })
    .catch( (err) => { console.log(err) });
});


// View all users
router.get('/', function(req, res){
    const users = mf.get_entities(USER)
    .then( (users) => {
        // Loop through users to add self attribute
        users.forEach(function (user) {
            user["self"] = USERS_URL + '/' + user["id"];
        });

        res.status(200).json(users);
    })
    .catch( (err) => { console.log(err) });
});


// Catch attempt to POST directly on users
router.post('/', function(req, res, next){
	// sends to login page
	res.redirect('/');
});

// Catch attempt to PUT on a user
router.put('/:id', function(req, res, next){
	res.set("Accept", "GET");
	return next(userHelpers.get_error(405));
});

// Catch attempt to PATCH on a user
router.patch('/:id', function(req, res, next){
	res.set("Accept", "GET");
	return next(userHelpers.get_error(405));
});

// Catch attempt to DELETE on a user
router.delete('/:id', function(req, res, next){
    // this section is for testing-mode deletion only
    const user = mf.get_an_entity(USER, req.params.id)
    .then( (user) => {
        // See if this boat exists
        if (!user[0]) {
            return next(get_error(404));
        }

        mf.delete_entity(USER, req.params.id).then(res.status(204).end());
    })
    .catch( (e) => { console.log(e) });

    // this section is for submission-mode
	//res.set("Accept", "GET");
	//return next(userHelpers.get_error(405));
});

// Catch attempt to PUT on root users
router.put('/', function(req, res, next){
    res.set("Accept", "GET");
    return next(userHelpers.get_error(405));
});

// Catch attempt to PATCH on root users
router.patch('/', function(req, res, next){
    res.set("Accept", "GET");
    return next(userHelpers.get_error(405));
});

// Catch attempt to DELETE on root users
router.delete('/', function(req, res, next){
    res.set("Accept", "GET");
    return next(userHelpers.get_error(405));
});

module.exports = router;