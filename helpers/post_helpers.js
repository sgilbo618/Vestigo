
/*--------------------------- Start exports ---------------------------*/

/*
 * Takes in a request body and gets out the attributes to build a post.
 * Gets today's date to add as well. Returns the post object.
 */
module.exports.build_post = function build_post(data){
    return {
        "title": data.title, 
        "location": data.location, 
        "body": data.body,
        "date": new Date()
    }
}


/*
 * Takes in a request body and gets out the attributes to build a post.
 * Gets today's date to add as edited date. Returns the post object.
 */
module.exports.build_put_post = function build_put_post(data){
    return {
        "title": data.title, 
        "location": data.location, 
        "body": data.body,
        "edited_date": new Date()
    }
}


/*
 * Takes in a post object and the data to update. Updates and returns the post
 * object.
 */
module.exports.build_patch_post = function build_patch_post(old_post, new_data){
    if (new_data["title"]) {
        old_post["title"] = new_data["title"];
    }

    if (new_data["location"]) {
        old_post["location"] = new_data["location"];
    }

    if (new_data["body"]) {
    	old_post["body"] = new_data["body"];
    }

    old_post.edited_date = new Date();

    return old_post;
}


/*
 * Takes in the request body for post a post and determines if it is valid. 
 * A valid post has 3 attributes, title, location, and body. Returns true 
 * if it does, false otherwise.
 */
module.exports.is_valid_post = function is_valid_post(post){
    // Checks for exactly 3 attributes
    if (Object.keys(post).length != 3) {
        return false;
    }

    // Checks for the correct attributes
    if (!post.title || !post.location || !post.body){
        return false;
    }

    // Input validation
    if (!is_valid_title(post.title) || !is_valid_location(post.location) || 
    	!is_valid_body(post.body)) {
        return false;
    }

    return true;
}


/*
 * Takes in the request body for patch a post and determines if it is valid. 
 * A valid patch can any subset of the attributes, title, location, body. 
 * Returns true if the body only contains a valid subset and the changes are 
 * valid. Returns false otherwise.
 */
module.exports.is_valid_patch = function is_valid_patch(data){
    // Checks for no more than 3 attributes
    if (Object.keys(data).length > 3) {
        return false;
    }

    let has_good_attributes = true;

    // Loop through object keys to validate attributes
    Object.keys(data).forEach(function(key) {
        // Make sure each attribute is one of the allowed attributes
        if (key != "title" && key != "location" && key != "body") {
            has_good_attributes = false;
        }

        // Validate title
        if (key == "title" && !is_valid_title(data[key])) {
            has_good_attributes = false;
        }

        // Validate location
        if (key == "location" && !is_valid_location(data[key])) {
            has_good_attributes = false;
        }

        // Validate body
        if (key == "body" && !is_valid_body(data[key])) {
        	has_good_attributes = false;
        }
    });

    return has_good_attributes;
}


/*
 * Takes in an integer to set the status of an error. Creates a new Error,
 * sets the status, and sets the message depending on which status was sent.
 */
module.exports.get_error = function get_error(status){
    const error = new Error();
    error.status = status;

    if (status == 400){
        error.message = "Something is wrong with the request object";
    
    } else if (status == 403) {
        error.message = "This user is not authorized to perform this action on this post"; 

    } else if (status == 404) {
        error.message = "No post with this post_id exists";

    } else if (status == 405) {
        error.message = "This operation is not supported on this route";

    } else if (status == 406) {
        error.message = "This content-type does not conform to the user agent criteria";

    } else if (status == 415) {
        error.message = "The media format of the requested data is not supported by the server";

    }

    return error;
}

/*------------------------------- End exports ------------------------------------*/


/*
 * Takes in the request body title attribute to validate it. A valid post title
 * must be a string and be less than 64 characters long. Returns true if valid, 
 * false otherwise.
 */
 function is_valid_title(title) {
    if (typeof title != 'string') {
        return false;
    }  

    if (title.length > 64) {
        return false;
    }

    return true;
 }


 /*
 * Takes in the request body location attribute to validate it. A valid post 
 * location must be a string and be less than 64 characters long. Returns true 
 * if valid, false otherwise.
 */
 function is_valid_location(location) {
    if (typeof location != 'string') {
        return false;
    }

    if (location.length > 64) {
        return false;
    }

    return true;
 }


/*
 * Takes in the request body body attribute to validate it. A valid post body  
 * must be a string and be less than 400 characters long. Returns true if valid, 
 * false otherwise.
*/
 function is_valid_body(body) {
    if (typeof body != 'string') {
        return false;
    }

    if (body.length > 400) {
        return false;
    }

    return true;
 }