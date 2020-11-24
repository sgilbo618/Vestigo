const express = require('express');
const handlebars = require('express-handlebars').create({defaultLayout: 'main'});

const app = express();

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

app.use('/', require('./index'));

// Error handler middleware
app.use((error, req, res, next) => {
	res.status(error.status || 500)
	.send({"Error": error.message || "Internal Server Error"});
});


// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});