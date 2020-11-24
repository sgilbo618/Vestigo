// datastore.js

const {Datastore} = require('@google-cloud/datastore');

module.exports.Datastore = Datastore;
module.exports.datastore = new Datastore();

module.exports.from_datastore = function from_datastore(item){
    item.id = item[Datastore.KEY].id;
    return item;
}