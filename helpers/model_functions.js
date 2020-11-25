// model_functions.js

// Define datastore
const ds = require('../helpers/datastore');
const datastore = ds.datastore;

// Define constants
const consts = require('../helpers/constants');
const POST = consts.POST;
const TAG = consts.TAG;
const POSTS_URL = consts.posts_url;
const TAGS_URL = consts.tags_url;

/*
 * Takes in a kind of entity and a unique name. Searches the db for a match. Returns the resutls.
*/
 module.exports.get_entity_by_name = function get_entity_by_name(kind, name) {
    const q = datastore.createQuery(kind)
    .filter("name", "=", name);
    return datastore.runQuery(q).then( (result) => {
        return result;
    });
 }


/*
 * Takes in a kind and an owner. Gets all the entities that are owned by this owner.
*/
 module.exports.get_entities_by_owner = function get_entities_by_owner(kind, owner) {
    const q = datastore.createQuery(kind);
    return datastore.runQuery(q).then( (entities) => {
        return entities[0].map(ds.from_datastore).filter(item => item.user_id == owner);
    });
 }


/*
 * Takes in a kind and the body data of an entity. Creates a new entity in the db.
*/
module.exports.post_entity = function post_entity(kind, data){
    var key = datastore.key(kind);
    return datastore.save({"key": key, "data": data}).then( () => {
            return key;
    });
}


/*
 * Takes in a kind and the id of an entity. Returns the entity that matches.
*/
module.exports.get_an_entity = function get_an_entity(kind, id){
    const key = datastore.key([kind, parseInt(id,10)]);
    return datastore.get(key).then( (entity) => {
        // Only map entity with id if it entity was found
        if (entity[0]) {
            return entity.map(ds.from_datastore);
        } else {
            return entity;
        }
    });
}


/*
 * Takes in a kind and returns all of its entities from the db. 
*/
module.exports.get_entities = function get_entities(kind){
    const q = datastore.createQuery(kind);
    return datastore.runQuery(q).then( (entities) => {
        if (entities[0]) {
          return entities[0].map(ds.from_datastore);
        }
        return entities[0];
    });
}


/*
 * Takes in the kind for the search, the limit of how many results desired, and
 * the request object to check/store the cursor. 
*/
module.exports.get_entities_pagination = function get_entities_pagination(kind, limit, req){
    var q = datastore.createQuery(kind).limit(limit);
    const results = {};
    
    let baseURL = "";
    if (kind == POST) {
        baseURL = posts_url;
    } else if (kind == TAG) {
        baseURL = tags_url;
    }

    // If req has a cursor, then adjust the query to start at that cursor
    if (Object.keys(req.query).includes("cursor")) {
        q = q.start(req.query.cursor);
    }

    // Get the next limit of entities
    return datastore.runQuery(q)
    .then( (entities) => {
        results.items = entities[0].map(ds.from_datastore);

        // See if there are anymore results
        if(entities[1].moreResults !== ds.Datastore.NO_MORE_RESULTS ){
            results.next = baseURL + "?cursor=" + entities[1].endCursor;
        }

        return results;
    });
}


/*
 * Takes in a kind, the id, and the body data of an entity. Updates entity in the db.
*/
module.exports.put_entity = function put_entity(kind, id, data){
    const key = datastore.key([kind, parseInt(id,10)]);
    return datastore.save({"key": key, "data": data}).then( () => {
        return key;
    });
}


/*
 * Takes in a kind and the id of an entity. Deletes the entity from the db.
*/
module.exports.delete_entity = function delete_entity(kind, id){
    const key = datastore.key([kind, parseInt(id,10)]);
    return datastore.delete(key);
}