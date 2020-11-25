
/*--------------------------- Start exports ---------------------------*/

/*
 * Takes in a request body and gets out the attributes to build a tag.
 * Gets today's date to add as well. Returns the post object.
 */
module.exports.build_tag = function build_tag(data){
    return {
        "label": data.label,
        "symbol": data.symbol,
        "description": data.description
    }
}


/*
 * Takes in a request body and gets out the attributes to build a tag.
 * Returns the tag object.
 */
module.exports.build_put_tag = function build_put_tag(data){
    return {
        "label": data.label,
        "symbol": data.symbol,
        "description": data.description
    }
}


/*
 * Takes in a tag object and the data to update. Updates and returns the tag
 * object.
 */
module.exports.build_patch_tag = function build_patch_tag(old_tag, new_data){
    if (new_data["label"]) {
        old_tag["label"] = new_data["label"];
    }

    if (new_data["symbol"]) {
        old_tag["symbol"] = new_data["symbol"];
    }

    if (new_data["description"]) {
    	old_tag["description"] = new_data["description"];
    }

    return old_tag;
}


/*
 * Takes in the request body for post a tag and determines if it is valid. 
 * A valid tag has 3 attributes, label, symbol, and description. Returns true 
 * if it does, false otherwise.
 */
module.exports.is_valid_post = function is_valid_post(tag){
    // Checks for exactly 3 attributes
    if (Object.keys(tag).length != 3) {
        return false;
    }

    // Checks for the correct attributes
    if (!tag.label || !tag.symbol || !tag.description){
        return false;
    }

    // Input validation
    if (!is_valid_label(tag.label) || !is_valid_symbol(tag.symbol) || 
    	!is_valid_description(tag.description)) {
        return false;
    }

    return true;
}


/*
 * Takes in the request body for patch a tag and determines if it is valid. 
 * A valid patch can have any subset of the attributes, label, symbol, and
 * description. 
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
        if (key != "label" && key != "symbol" && key != "description") {
            has_good_attributes = false;
        }

        // Validate label
        if (key == "label" && !is_valid_label(data[key])) {
            has_good_attributes = false;
        }

        // Validate symbol
        if (key == "symbol" && !is_valid_symbol(data[key])) {
            has_good_attributes = false;
        }

        // Validate description
        if (key == "description" && !is_valid_description(data[key])) {
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
    
    } else if (status == 404) {
        error.message = "No tag with this tag_id exists";

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
 * Takes in the request body label attribute to validate it. A valid post label
 * must be a string and be less than/equal to 32 characters long. Returns true if 
 * valid, false otherwise.
 */
 function is_valid_label(label) {
    if (typeof label != 'string') {
        return false;
    }  

    if (label.length > 32) {
        return false;
    }

    return true;
 }


 /*
 * Takes in the request body symbol attribute to validate it. A valid tag 
 * symbol must be a string and be less than/ equal to 2 characters long. 
 * Returns true if valid, false otherwise.
 */
 function is_valid_symbol(symbol) {
    if (typeof symbol != 'string') {
        return false;
    }

    if (symbol.length > 2) {
        return false;
    }

    return true;
 }


/*
 * Takes in the request body description attribute to validate it. A valid tag body  
 * must be a string and be less than 200 characters long. Returns true if valid, 
 * false otherwise.
*/
 function is_valid_description(description) {
    if (typeof description != 'string') {
        return false;
    }

    if (description.length > 200) {
        return false;
    }

    return true;
 }