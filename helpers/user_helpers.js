// user_helpers.js
const ds = require('../helpers/datastore');
const datastore = ds.datastore;


/*
 * Takes in the kind and the sub property of a user. Gets the entity from datastore
 * that matches and returns it.
*/
module.exports.get_user_by_sub = function get_user_by_sub(kind, sub){
	const q = datastore.createQuery(kind)
    .filter("sub", "=", sub);
    return datastore.runQuery(q).then( (result) => {
        return result[0].map(ds.from_datastore);
    });
}

/*
 * Takes in a decoded jwt as data and gets the nickname, email, and sub to create
 * an object to represent the user for the datastore. Returns the user object.
*/
module.exports.build_user = function build_user(data){
	return {
		"name": data.nickname,
		"email": data.email,
		"sub": data.sub
	}
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
        error.message = "No user with this user_id exists";

    } else if (status == 405) {
        error.message = "This operation is not supported on this route";

    } else if (status == 406) {
        error.message = "This content-type does not conform to the user agent criteria";

    } else if (status == 415) {
        error.message = "The media format of the requested data is not supported by the server";
    }

    return error;
}