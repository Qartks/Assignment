/**
 * Created by qartks on 3/29/17.
 */
var express = require('express');
var app = express();

var bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

require('./Amne/app')(app);


app.listen(process.env.PORT || 3000, function () {
    console.log("Running server on " + (process.env.PORT || 3000));
});
