const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();
const mf = require('../helpers/model_functions.js');
const ph = require('../helpers/post_helpers.js');
const uh = require('../helpers/user_helpers.js');
const jwt = require('../middleware/jwt.js');


// Define constants
const consts = require('../helpers/constants');
const POST = consts.POST;
const USER = consts.USER;
const posts_url = consts.posts_url;

router.use(bodyParser.json());


// Create post
// Protected - must contain valid jwt to create new post
router.post('/', jwt.checkJwt, function(req, res, next){
    // Validate content type
    if (req.get("content-type") !== "application/json") {
        return next(ph.get_error(406));
    }

    // Validate request body
    if (!ph.is_valid_post(req.body)) {
        return next(ph.get_error(400));
    }

    // Validate accepts type
    const accepts = req.accepts("application/json");
    if (!accepts) {
        return next(ph.get_error(415));
    }

    // Get the user who is posting
    const user = uh.get_user_by_sub(USER, req.user.sub)
    .then( (user) => {

		// Create new post from body
		const new_post = ph.build_post(req.body);

		// Add user info to the new post
		new_post.user_name = user[0].name;
		new_post.user_id = user[0].id;

		// Add to datastore and retrieve key
		mf.post_entity(POST, new_post)
		.then( (key) => {

		    // Add fields to new_boat for json response
		    new_post["id"] = key.id;
		    new_post["self"] = posts_url + '/' + key.id;
		    res.status(201).json(new_post);
		})
		.catch( (err) => { console.log(err) });
    })
    .catch( (err) => { console.log(err) });
});


// View a post
// Protected - must contain valid jwt to display this user's post
router.get('/:id', jwt.checkJwt, function(req, res, next){
    const post = mf.get_an_entity(POST, req.params.id)
    .then( (post) => {
        // See if post exists
        if (!post[0]) {
            return next(ph.get_error(404));
        }

        // Add self
        post[0]["self"] = posts_url + '/' + post[0]["id"];
        
        // Make sure accept MIME is supported
        const accepts = req.accepts(["application/json"]);
        if (!accepts) {
            return next(ph.get_error(415));

        // Return JSON
        } else if (accepts === "application/json") {
            res.status(200).json(post[0]);

        } else {
            res.status(500).send("Content type got messed up");
        }
    })
    .catch( (err) => { console.log(err) });
});


// View all posts
// Protected - must contain valid jwt to display all of this user's posts
router.get('/', jwt.checkJwt, function(req, res){
	// Get the user 
	const user = uh.get_user_by_sub(USER, req.user.sub)
	.then( (user) => {
		// See if user exists
		if (!user[0]) {
			return next(uh.get_error(404));
		}

		// Get this user's posts
		const posts = mf.get_entities_by_owner(POST, user[0].id)
	    .then( (posts) => {
	        // Loop through posts to add self attribute
	        posts.forEach(function (post) {
	            post["self"] = posts_url + '/' + post["id"];
	        });

	        res.status(200).json(posts);
	    })
	    .catch( (err) => { console.log(err) });
	})
	.catch( (err) => { console.log(err) });

});


module.exports = router;