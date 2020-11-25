const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router({mergeParams: true});
const mf = require('../helpers/model_functions.js');
const ph = require('../helpers/post_helpers.js');


// Define constants
const consts = require('../helpers/constants');
const POST = consts.POST;
const TAG = consts.TAG;
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
    	error.message = "The tag with this tag id is already on the post with this post id"; 

    } else if (status == 404 && entity == "add"){
        error.message = "The specified post and/or tag does not exist";
    
    } else if (status == 404 && entity == "post") {
        error.message = "No post with this post id exists";

    } else if (status == 404 && entity == "tag") {
        error.message = "No tag with this tag id exists";

	} else if (status == 404 && entity == "remove"){
        error.message = "No tag with this tag id is on the post with this post id";
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
            return next(get_error(404, "add"));
        }

        // Get the post
        const post = mf.get_an_entity(POST, req.params.pid)
        .then( (post) => {
            // See if post exists
            if (!post[0]) {
                return next(get_error(404, "add"));
            }

            // See if tag is already on a post
            post[0]["tags"].forEach( (pTag) => {
            	if (pTag["id"] === tag[0]["id"]) {
            		return next(get_error(403, "add"));
            	}
            });

            // Build the tag info to add to post tags list
            const new_tag = {
            	"id": tag[0]["id"],
            	"label": tag[0]["label"],
            	"self": TAGS_URL + '/' + tag[0]["id"]
            }

            // Update the tags list for this post
            post[0]["tags"].push(new_tag);
            mf.put_entity(POST, req.params.pid, post[0])
            .then(res.status(204).end());
        })
        .catch( (err) => { console.log(err) });
    })
    .catch( (err) => { console.log(err) });
});

module.exports = router;