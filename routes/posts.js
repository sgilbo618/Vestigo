const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();
const mf = require('../helpers/model_functions.js');
const userHelpers = require('../helpers/post_helpers.js');


// Define constants
const consts = require('../helpers/constants');
const POST = consts.POST;
const posts_url = consts.posts_url;

router.use(bodyParser.json());



module.exports = router;