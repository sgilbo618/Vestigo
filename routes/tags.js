const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();
const mf = require('../helpers/model_functions.js');
const th = require('../helpers/tag_helpers.js');


// Define constants
const consts = require('../helpers/constants');
const TAG = consts.TAG;
const tags_url = consts.tags_url;

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
	    new_tag["self"] = tags_url + '/' + key.id;
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

        // Add self
        tag[0]["self"] = tags_url + '/' + tag[0]["id"];
        
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
});



// View all tags
router.get('/', function(req, res){
	// Get all the tags
	const tags = mf.get_entities(TAG)
    .then( (tags) => {
        // Loop through tags to add self attribute
        tags.forEach(function (tag) {
            tag["self"] = tags_url + '/' + tag["id"];
        });

        res.status(200).json(tags);
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
            updated_tag["self"] = tags_url + '/' + key.id;

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
            updated_tag["self"] = tags_url + '/' + key.id;
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

		// Delete post
    	mf.delete_entity(TAG, req.params.id)
    	.then(res.status(204).end());
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