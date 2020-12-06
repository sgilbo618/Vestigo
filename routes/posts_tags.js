const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router({mergeParams: true});
const mf = require('../helpers/model_functions.js');
const ph = require('../helpers/post_helpers.js');


// Define constants
const consts = require('../helpers/constants');
const POST = consts.POST;
const TAG = consts.TAG;
const POST_TAG = consts.POST_TAG;
const POSTS_URL = consts.POSTS_URL;
const TAGS_URL = consts.TAGS_URL;

router.use(bodyParser.json());


/*
 * Takes in an integer to set the status of an error. Creates a new Error,
 * sets the status, and sets the message depending on which status was sent.
 */
function get_error(status, entity){
    const error = new Error();
    error.status = status;

    if (status == 403 && entity == "add") {
    	error.message = "The tag with this tag_id is already on the post with this post_id"; 

    } else if (status == 404 && entity == "add"){
        error.message = "The specified post and/or tag does not exist";
    
    } else if (status == 404 && entity == "post") {
        error.message = "No post with this post_id exists";

    } else if (status == 404 && entity == "tag") {
        error.message = "No tag with this tag_id exists";

	} else if (status == 404 && entity == "remove"){
        error.message = "No tag with this tag_id is on the post with this post_id";
    }

    return error;
}


// Assign a tag to a post
// Not protected
router.put('/', function(req, res, next){
    // Get the tag
    const tag = mf.get_an_entity(TAG, req.params.tid)
    .then( (tag) => {
        // See if tag exists
        if (!tag[0]) {
            return next(get_error(404, "tag"));
        }

        // Get the post
        const post = mf.get_an_entity(POST, req.params.pid)
        .then( (post) => {
            // See if post exists
            if (!post[0]) {
                return next(get_error(404, "post"));
            }

            // See if this tag is on this post already
            const post_tag = mf.get_post_tag(POST_TAG, post[0]["id"], tag[0]["id"])
            .then( (post_tag) => {

                if (post_tag[0]) {
                    return next(get_error(403, "add"));
                }

                // Build the new post-tag relationship
                const new_post_tag = {
                    "post_id": post[0]["id"],
                    "tag_id": tag[0]["id"],
                    "tag_label": tag[0]["label"]
                }

                // Add post-tag to datastore
                mf.post_entity(POST_TAG, new_post_tag)
                .then(res.status(204).end());
            })
            .catch( (err) => { console.log(err) });
        })
        .catch( (err) => { console.log(err) });
    })
    .catch( (err) => { console.log(err) });
});



// Remove tag from post
router.delete('/', function(req, res, next){
    // Get the tag
    const tag = mf.get_an_entity(TAG, req.params.tid)
    .then( (tag) => {
        // See if tag exists
        if (!tag[0]) {
            return next(get_error(404, "tag"));
        }

        // Get the post
        const post = mf.get_an_entity(POST, req.params.pid)
        .then( (post) => {
            // See if post exists
            if (!post[0]) {
                return next(get_error(404, "tag"));
            }

            // See if tag is on this post
            const post_tag = mf.get_post_tag(POST_TAG, post[0]["id"], tag[0]["id"])
            .then( (post_tag) => {

                if (!post_tag[0]) {
                    return next(get_error(404, "remove"));
                }

                // Remove post-tag from datastore
                mf.delete_entity(POST_TAG, post_tag[0]["id"])
                .then(res.status(204).end());
            })
            .catch( (err) => { console.log(err) });
        })
        .catch( (err) => { console.log(err) });
    })
    .catch( (err) => { console.log(err) });
});

module.exports = router;