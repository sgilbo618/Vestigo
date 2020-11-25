const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();
const mf = require('../helpers/model_functions.js');
const th = require('../helpers/tag_helpers.js');


// Define constants
const consts = require('../helpers/constants');
const TAG = consts.TAG;
const POST_TAG = consts.POST_TAG;
const TAGS_URL = consts.TAGS_URL;
const POSTS_URL = consts.POSTS_URL;

router.use(bodyParser.json());



// Create tag
router.post('/', function(req, res, next){
    // Validate content type
    if (req.get("content-type") !== "application/json") {
        return next(th.get_error(406));
    }

    // Validate request body
    if (!th.is_valid_post(req.body)) {
        return next(th.get_error(400));
    }

    // Validate accepts type
    const accepts = req.accepts("application/json");
    if (!accepts) {
        return next(th.get_error(415));
    }

	// Create new tag from body
	const new_tag = th.build_tag(req.body);

	// Add to datastore and retrieve key
	mf.post_entity(TAG, new_tag)
	.then( (key) => {

	    // Add fields to new tag for json response
	    new_tag["id"] = key.id;
	    new_tag["self"] = TAGS_URL + '/' + key.id;
	    res.status(201).json(new_tag);
	})
	.catch( (err) => { console.log(err) });
});



// View a tag
router.get('/:id', function(req, res, next){
    const tag = mf.get_an_entity(TAG, req.params.id)
    .then( (tag) => {
        // See if tag exists
        if (!tag[0]) {
            return next(th.get_error(404));
        }

        // See if tag is on posts
        const post_tags = mf.get_post_tag_by_tag_id(POST_TAG, tag[0]["id"])
        .then( (post_tags) => {
            // Build list of posts
            let posts = [];
            post_tags.forEach( (post_tag) => {
                posts.push({
                    "id": post_tag["post_id"],
                    "self": POSTS_URL + '/' + post_tag["post_id"]
                });
            });

            // Add self and posts
            tag[0]["self"] = TAGS_URL + '/' + tag[0]["id"];
            tag[0]["posts"] = posts;
            
            // Make sure accept MIME is supported
            const accepts = req.accepts(["application/json"]);
            if (!accepts) {
                return next(th.get_error(415));

            // Return JSON
            } else if (accepts === "application/json") {
                res.status(200).json(tag[0]);

            } else {
                res.status(500).send("Content type got messed up");
            }
        })
        .catch( (err) => { console.log(err) });
    })
    .catch( (err) => { console.log(err) });
});



// View all tags
router.get('/', function(req, res){
	// Get all the tags
	//const tags = mf.get_entities(TAG)
    const tags = mf.get_entities_pagination(TAG, 5, req)
    .then( (tags) => {
        let promises = [];

        // Loop through tags to add posts and self attribute
        tags["items"].forEach(function (tag) {
            tag["self"] = TAGS_URL + '/' + tag["id"];

            // Get posts for this tag and send promise to wait list
            promises.push(mf.get_post_tag_by_tag_id(POST_TAG, tag["id"])
            .then( (post_tags) => {
                // Build posts list
                let posts = [];
                post_tags.forEach( (post_tag) => {
                    posts.push({
                        "id": post_tag["post_id"],
                        "self": POSTS_URL + '/' + post_tag["post_id"]
                    });
                });

                tag["posts"] = posts;
            })
            .catch( (err) => { console.log(err) })
            )
        });

        // Add next object if there is one
        if (tags["next"]) {
            tags["items"].push({"next": tags["next"]});
        }

        // Wait for all the post_tag promises to resolve
        Promise.all(promises).then(() => {
            res.status(200).json(tags["items"]);
        })
        .catch( (err) => { console.log(err) });
    })
    .catch( (err) => { console.log(err) });
});



// Modify a tag - PUT
router.put('/:id', function(req, res, next){
    // Validate content type
    if (req.get("content-type") !== "application/json") {
        return next(th.get_error(406));
    }

    // Validate the body has correct attributes (same as post)
    if (!th.is_valid_post(req.body)) {
        return next(th.get_error(400));
    }

    // Get the current tag
    const tag = mf.get_an_entity(TAG, req.params.id)
    .then( (tag) => {    
        // See if tag exists
        if (!tag[0]) {
            return next(th.get_error(404));
        }

        // Validate accepts type
        const accepts = req.accepts("application/json");
        if (!accepts) {
            return next(th.get_error(415));
        }

        // Build a new tag with the updated info
        const updated_tag = th.build_put_tag(req.body);

        // Update tag
        mf.put_entity(TAG, req.params.id, updated_tag)
        .then( (key) => {

            // Add extra fields
            updated_tag["id"] = key.id.toString();
            updated_tag["self"] = TAGS_URL + '/' + key.id;

            res.setHeader("Location", updated_tag["self"]);
            res.status(303).json(updated_tag);
        })
        .catch( (err) => { console.log(err) });  
    })
    .catch( (err) => { console.log(err) });
});



// Modify a tag - PATCH
router.patch('/:id', function(req, res, next){
    // Validate content type
    if (req.get("content-type") !== "application/json") {
        return next(th.get_error(406));
    }

    // Validate the desired updates
    if (!th.is_valid_patch(req.body)) {
        return next(th.get_error(400));
    }

    // Get the current tag
    const tag = mf.get_an_entity(TAG, req.params.id)
    .then( (tag) => {    
        // See if tag exists
        if (!tag[0]) {
            return next(th.get_error(404));
        }

        // Build a new tag with the updated info
        const updated_tag = th.build_patch_tag(tag[0], req.body);

        // Validate accepts type
        const accepts = req.accepts("application/json");
        if (!accepts) {
            return next(th.get_error(415));
        }

        // Update post
        mf.put_entity(TAG, req.params.id, updated_tag)
        .then( (key) => {

            // Add extra fields
            updated_tag["id"] = key.id.toString();
            updated_tag["self"] = TAGS_URL + '/' + key.id;
            res.status(200).json(updated_tag);
        })
        .catch( (err) => { console.log(err) });   
    })
    .catch( (err) => { console.log(err) });
});



// Delete a tag
router.delete('/:id', function(req, res, next){
    const tag = mf.get_an_entity(TAG, req.params.id)
    .then( (tag) => {
        // See if this tag exists
        if (!tag[0]) {
            return next(th.get_error(404));
        }

        // Get all the post_tags for this tag
        const post_tags = mf.get_post_tag_by_tag_id(POST_TAG, tag[0]["id"])
        .then( (post_tags) => {
            let promises = [];

            // Delete each post_tag and push promise to wait list
            post_tags.forEach( (post_tag) => {
                promises.push(mf.delete_entity(POST_TAG, post_tag["id"]));
            });

            // Delete tag when all post_tags delete promises are resolved
            Promise.all(promises).then(() => {
                mf.delete_entity(TAG, req.params.id)
                .then(res.status(204).end()).catch((err)=>{console.log(err)});
            })
            .catch( (err) => { console.log(err) });
        })
        .catch( (err) => { console.log(err) });
    })
    .catch( (err) => { console.log(err) });
});



// Catch attempt to PUT on /tags
router.put('/', function(req, res, next){
    res.set("Accept", "GET, POST");
    return next(th.get_error(405));
});

// Catch attempt to PATCH on /tags
router.patch('/', function(req, res, next){
    res.set("Accept", "GET, POST");
    return next(th.get_error(405));
});

// Catch attempt to DELETE on /tags
router.delete('/', function(req, res, next){
    res.set("Accept", "GET, POST");
    return next(th.get_error(405));
});

// Catch attempt to POST on /posts/:id
router.post('/:id', function(req, res, next){
	res.set("Accept", "GET, PUT, PATCH, DELETE");
	return next(th.get_error(405));
});

module.exports = router;