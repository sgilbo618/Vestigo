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
const POST_TAG = consts.POST_TAG;
const POSTS_URL = consts.POSTS_URL;
const TAGS_URL = consts.TAGS_URL;

router.use(bodyParser.json());



// Create post
// Protected - only a verified user can create a post
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

		    // Add fields to new post for json response
		    new_post["id"] = key.id;
		    new_post["self"] = POSTS_URL + '/' + key.id;
		    res.status(201).json(new_post);
		})
		.catch( (err) => { console.log(err) });
    })
    .catch( (err) => { console.log(err) });
});



// View a post
// Protected - only a verified user can view their post
router.get('/:id', jwt.checkJwt, function(req, res, next){
    const post = mf.get_an_entity(POST, req.params.id)
    .then( (post) => {
        // See if post exists
        if (!post[0]) {
            return next(ph.get_error(404));
        }

        // See if post has tags
        const post_tags = mf.get_post_tag_by_post_id(POST_TAG, post[0]["id"])
        .then( (post_tags) => {
            // Build tags list
            let tags = [];

            post_tags.forEach( (post_tag) => {
                tags.push({
                    "id": post_tag["tag_id"],
                    "label": post_tag["tag_label"],
                    "self": TAGS_URL + '/' + post_tag["tag_id"]
                });
            });

            // Add self and tags
            post[0]["self"] = POSTS_URL + '/' + post[0]["id"];
            post[0]["tags"] = tags;
            
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
    })
    .catch( (err) => { console.log(err) });
});



// View all posts
// Protected - only a verfied user can view all their posts
router.get('/', jwt.checkJwt, function(req, res){
	// Get the user 
	const user = uh.get_user_by_sub(USER, req.user.sub)
	.then( (user) => {
		// See if user exists
		if (!user[0]) {
			return next(uh.get_error(404));
		}

		// Get this user's posts
        const posts = mf.get_entities_by_owner_pagination(POST, 5, req, user[0].id)
	    .then( (posts) => {
            let promises = [];

	        // Loop through posts to add tags and self attribute
            posts["items"].forEach(function (post) {
	            post["self"] = POSTS_URL + '/' + post["id"];

                // Get the post_tags for this post and push promise to wait list
                promises.push(mf.get_post_tag_by_post_id(POST_TAG, post["id"])
                .then( (post_tags) => {
                    // Build tags list
                    let tags = [];

                    post_tags.forEach( (post_tag) => {
                        tags.push({
                            "id": post_tag["tag_id"],
                            "label": post_tag["tag_label"],
                            "self": TAGS_URL + '/' + post_tag["tag_id"]
                        });
                    });

                    post["tags"] = tags;

                })
                .catch( (err) => { console.log(err) })
                )
	        });

            // Add next object if there is one
            if (posts["next"]) {
                posts["items"].push({"next": posts["next"]});
            }

            // Wait for all the post_tag promises to resolve
            Promise.all(promises).then(() => {
                res.status(200).json(posts["items"])
            })
            .catch( (err) => { console.log(err) });
	    })
	    .catch( (err) => { console.log(err) });
	})
	.catch( (err) => { console.log(err) });
});



// Modify a post - PUT
// Protected - only the verified user who owns the post can edit it
router.put('/:id', jwt.checkJwt, function(req, res, next){
    // Validate content type
    if (req.get("content-type") !== "application/json") {
        return next(ph.get_error(406));
    }

    // Validate the body has correct attributes (same as post)
    if (!ph.is_valid_post(req.body)) {
        return next(ph.get_error(400));
    }

    // Get the current post
    const post = mf.get_an_entity(POST, req.params.id)
    .then( (post) => {    
        // See if post exists
        if (!post[0]) {
            return next(ph.get_error(404));
        }

        // Get the user of this jwt
        const user = uh.get_user_by_sub(USER, req.user.sub)
        .then( (user) => {
        	// See if user exists and is the owner of this post
        	if (!user[0] || post[0]["user_id"] != user[0]["id"]) {
        		return next(uh.get_error(404));
        	}

	        // Validate accepts type
	        const accepts = req.accepts("application/json");
	        if (!accepts) {
	            return next(ph.get_error(415));
	        }

	        // Build a new post with the updated info
	        const updated_post = ph.build_put_post(req.body);
	        updated_post.date = post[0].date;
	        updated_post.tags = post[0].tags;
			updated_post.user_name = post[0].user_name;
			updated_post.user_id = post[0].user_id;

	        // Update post
	        mf.put_entity(POST, req.params.id, updated_post)
	        .then( (key) => {

	            // Add extra fields
	            updated_post["id"] = key.id.toString();
	            updated_post["self"] = POSTS_URL + '/' + key.id;

	            res.setHeader("Location", updated_post["self"]);
	            res.status(303).json(updated_post);
	        })
	        .catch( (err) => { console.log(err) }); 
        })
        .catch( (err) => { console.log(err) });  
    })
    .catch( (err) => { console.log(err) });
});



// Modify a post - PATCH
// Protected - only the verified user who owns the post can edit it
router.patch('/:id', jwt.checkJwt, function(req, res, next){
    // Validate content type
    if (req.get("content-type") !== "application/json") {
        return next(ph.get_error(406));
    }

    // Validate the desired updates
    if (!ph.is_valid_patch(req.body)) {
        return next(ph.get_error(400));
    }

    // Get the current post
    const post = mf.get_an_entity(POST, req.params.id)
    .then( (post) => {    
        // See if post exists
        if (!post[0]) {
            return next(ph.get_error(404));
        }

        // Get the user of this jwt
        const user = uh.get_user_by_sub(USER, req.user.sub)
        .then( (user) => {
        	// See if user exists and is the owner of this post
        	if (!user[0] || post[0]["user_id"] != user[0]["id"]) {
        		return next(uh.get_error(404));
        	}
	        // Build a new post with the updated info
	        const updated_post = ph.build_patch_post(post[0], req.body);

            // Validate accepts type
            const accepts = req.accepts("application/json");
            if (!accepts) {
                return next(ph.get_error(415));
            }

            // Update post
            mf.put_entity(POST, req.params.id, updated_post)
            .then( (key) => {

                // Add extra fields
                updated_post["id"] = key.id.toString();
                updated_post["self"] = POSTS_URL + '/' + key.id;
                res.status(200).json(updated_post);
            })
            .catch( (err) => { console.log(err) });   
        })
        .catch( (err) => { console.log(err) });
    })
    .catch( (err) => { console.log(err) });
});



// Delete a post
// Protected - only the verified user who owns the post can delete the post
router.delete('/:id', jwt.checkJwt, function(req, res, next){
    const post = mf.get_an_entity(POST, req.params.id)
    .then( (post) => {
        // See if this ost exists
        if (!post[0]) {
            return next(ph.get_error(404));
        }

        // Get the user of this jwt
        const user = uh.get_user_by_sub(USER, req.user.sub)
		.then( (user) => {
			// See if user exists and if they own this post
			if (!user[0] || post[0]["user_id"] != user[0]["id"]) {
				return next(uh.get_error(404));
			}

            // Get the post_tags for this post
            const post_tags = mf.get_post_tag_by_post_id(POST_TAG, post[0]["id"])
            .then( (post_tags) => {
                let promises = [];

                // Delete each post_tag and push promise to wait list
                post_tags.forEach( (post_tag) => {
                    promises.push(mf.delete_entity(POST_TAG, post_tag["id"]));
                });

                // Delete post when all post_tags are deleted
                Promise.all(promises).then(() => {
                    mf.delete_entity(POST, req.params.id)
                    .then(res.status(204).end()).catch((err)=>{console.log(err)});
                })
                .catch( (err) => { console.log(err) });
            })
            .catch( (err) => { console.log(err) });
   		})
    	.catch( (err) => { console.log(err) });
    })
    .catch( (err) => { console.log(err) });
});



// Catch attempt to PUT on /posts
router.put('/', function(req, res, next){
    res.set("Accept", "GET, POST");
    return next(ph.get_error(405));
});

// Catch attempt to PATCH on /posts
router.patch('/', function(req, res, next){
    res.set("Accept", "GET, POST");
    return next(ph.get_error(405));
});

// Catch attempt to DELETE on /posts
router.delete('/', function(req, res, next){
    res.set("Accept", "GET, POST");
    return next(ph.get_error(405));
});

// Catch attempt to POST on /posts/:id
router.post('/:id', function(req, res, next){
	res.set("Accept", "GET, PUT, PATCH, DELETE");
	return next(ph.get_error(405));
});

module.exports = router;