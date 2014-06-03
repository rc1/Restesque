var express = require('express');
var argv = require('optimist').argv;
var Restesque = require('./src/Restesque');
var http = require('http');

var restesque = new Restesque();
var app = express();

app.configure(function(){
    app.set('port', process.env.PORT || argv.p || 4000);
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(restesque.connectMiddleware());
});

var server = http.createServer(app);

server.listen(app.get('port'), function() {
    console.log( lcyan("Restesque", "serving")+ ":" );
    console.log("\nfrom port:",  green(app.get('port')) );
});

// Bit of color
function green() { return "\033[1;32m" +  [].slice.apply(arguments).join(' ') + "\033[0m"; }
function green() { return "\033[1;32m" +  [].slice.apply(arguments).join(' ') + "\033[0m"; }
function lcyan() { return "\033[1;36m" + [].slice.apply(arguments).join(' ') + "\033[0m"; }
function bold() { return "\033[1m" + [].slice.apply(arguments).join(' ') + "\033[0m"; }