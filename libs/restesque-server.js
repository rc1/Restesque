// Runs a restesque websocket instance
// Enviroment Options:
// * RESTESQUE_ROOT_KET <string> - _default_ meta
// * PORT <number> - _default_ 6969
// * REDIS_DB <number> - _default_ 3

// # Modules
var redis = require( 'redis' );
var express = require( 'express' );
var WS = require( 'ws' );
var http = require( 'http' );
var DB = require( '../libs/redis-three-level-tree-storage' );
var RestesqueWebsocketRouter = require( '../libs/restesque-websocket-router.js' );

// # Database
// ## Redis
var redisClient;
if ( process.env.REDISTOGO_URL ) {
        // - Heroku Configuration
    var rtg = require("url").parse( process.env.REDISTOGO_URL );
    // For storing and getting data
    redisClient = redis.createClient( rtg.port, rtg.hostname );
    redisClient.auth( rtg.auth.split( ":" )[ 1 ] );
} else {
    // - Local Configuration
    redisClient = redis.createClient( process.env.REDIS_PORT, process.env.REDIS_HOST);
	redisClient.select( process.env.REDIS_DB || 3 );
}
// Select the correct db
redisClient.on( 'error', function ( err ) {
    console.error( 'Redis client error', err );
});

var db = new DB( redisClient );

// # Express WebSocket Connection

var port = process.env.PORT || 6969;
var app = express();
var server = http.createServer( app );

server.listen( port, function() {
    console.log( lcyan('Restesque', 'running')+ ':' );
    console.log('\nfrom port:',  green( port ) );
});

var wss = new WS.Server( { 
    server: server 
});

wss.on( 'error', function ( err ) {
	console.log( 'WSS Error:', err );
});

// # Bind the route

RestesqueWebsocketRouter( wss, db, process.env.RESTESQUE_ROOT_KET || 'meta' );

// # Utils 

// ## Terminal color
function green() { return '\033[1;32m' +  [].slice.apply(arguments).join(' ') + '\033[0m'; }
function green() { return '\033[1;32m' +  [].slice.apply(arguments).join(' ') + '\033[0m'; }
function lcyan() { return '\033[1;36m' +  [].slice.apply(arguments).join(' ') + '\033[0m'; }
function bold()  { return '\033[1m' +     [].slice.apply(arguments).join(' ') + '\033[0m'; }
