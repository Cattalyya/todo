var express = require('express');
var app = express();
var port = process.env.PORT || 3000; // from heroku

app.use(express.static(__dirname+'/public'));

app.listen(port, function() {
	console.log('Express server started at port '+port);
});
