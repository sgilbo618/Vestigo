// index.js
const router = module.exports = require('express').Router();

router.use('/posts', require('./routes/posts'));
router.use('/tags'), require('./routes/tags');
//router.use('/comments', require('./routes/comments'));
router.use('/users', require('./routes/users'));
router.use('/', require('./routes/webApp'));