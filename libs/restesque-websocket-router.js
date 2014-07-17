// # Modules
var W = require( 'w-js' );
var util = require( 'util' );
// ## Libs
var Packet = require( './packet.js' );

module.exports = function ( wss, db ) {

    // # Router
    var router = new W.Router();

    // ## Map
    router
        .map( '/:service/', [ 'GET', 'SUBSCRIBE', 'UNSUBSCRIBE' ] )
            .to( checkAuthenticated )
            .toWhenMethod( 'GET', get )
        .map( '/:service/:id/', [ 'DELETE', 'GET', 'SUBSCRIBE', 'UNSUBSCRIBE' ] )
            .to( checkAuthenticated )
            .toWhenMethod( 'GET', get )
            .toWhenMethod( 'DELETE', del )
            .toWhenMethod( 'SUBSCRIBE', subscribe )
            //.toWhenMethod( 'DELETE', idPubSub )
        .map( '/:service/:id/:key/', [ 'DELETE', 'POST', 'GET', 'SUBSCRIBE', 'UNSUBSCRIBE' ] )
            .to( checkAuthenticated )
            // .to( function ( route, req, client, next ) { console.log( '-----' ); next(); } )
            .toWhenMethod( 'GET', get )
            .toWhenMethod( 'DELETE', del )
            .toWhenMethod( 'POST', post )
            .toWhenMethod( [ 'DELETE', 'POST' ], trigger )
            //.toWhenMethod( [ 'DELETE', 'POST' ], triggerId )
            .toWhenMethod( 'SUBSCRIBE', subscribe )
            .toWhenMethod( 'UNSUBSCRIBE', unsubscribe );

    // ## Routing handlers

    function checkAuthenticated ( route, req, client, next ) {
        next();
    }

    function get ( route, req, client, next  ) {
        db.get( route.params.service, route.params.id, route.params.key ).done( function ( err, data ) {
            if ( err ) {
                return console.error( 'error', err );
            }
            // set the packet
            var packet = Packet.make()
                            .uri( req.uri )
                            .status( Packet.OK )
                            .body( data )
                            .token( req.token );
            // send it
            send( client, packet );
        });
        next();
    }

    function post ( route, req, client, next  ) {
        if ( W.isNotOk( route.params.id ) || W.isNotOk( route.params.key ) ) {
            return console.error( 'attempt to post without id and key' );
        }
        var typeOfBody = typeof req.body;
        if ( typeOfBody === 'undefined' || typeOfBody === 'function' ) {
            return console.error( 'body is of wrong type' );
        }
        var dataToStore = req.body;
        if ( typeof dataToStore === 'object' ) {
            try {
                dataToStore = JSON.stringify( dataToStore );
            } catch ( err ) {
                return console.error( 'failed to parse req.body on post' );
            }
        }
        db.post( route.params.service, route.params.id, route.params.key, dataToStore ).done( function ( err, data ) {
            if ( err ) {
                return console.error( 'failed to post json', err );
            }
            var packet = Packet.make()
                            .method( 'POST' )
                            .uri( req.uri )
                            .status( Packet.OK )
                            .token( req.token )
                            .body( req.body );

            // Pass the packet for trigger middleware
            req.subscriptionBroadcastPacket = packet;
           
            // send it
            send( client, packet );

            next();
        });
    }

    function del ( route, req, client, next ) {
        if ( W.isNotOk( route.params.id ) ) {
            return console.error( 'attempt to delete with id' );
        }
        db.del( route.params.service, route.params.id, route.params.key ).done( function ( err, data ) {
            if ( err ) {
                return console.error( 'error on del', err );
            }
            var packet = Packet.make()
                            .method( 'DELETE' )
                            .uri( req.uri )
                            .status( Packet.OK )
                            .token( req.token );
            send( client, packet );
            // pass the packet on through the middleware
            route.subscriptionBroadcastPacket = packet;
            next();
        });
    }

    // # Websocket Sending

    function send( client, packet ) {
        if ( typeof packet === 'string' ) {
            client.send( packet, function ( err ) {
                if ( err ) {
                    console.error( 'Write failed. Should we remove the client?' );
                }
            });
        } else if ( packet instanceof Packet ) {
            client.send( packet.getAsJsonStr(), function ( err ) {
                if ( err ) {
                    console.error( 'Write failed. Should we remove the client?' );
                }
            });
        }
    }

    // # PubSub

    // ## Subscribable
    // This allows clients to track what they are subscibed to, and what the tokens are

    function tokenForSubscription ( ws, uri ) {
        if ( typeof ws.routeTokenMap === 'undefined' ) {
    	   return null;
        }
        var mappedToken = ws.routeTokenMap[ uri ];
        if ( typeof mappedToken === 'undefined' ) {
            return null;
        } else if ( mappedToken === false ) {
            return null;
        } else if ( mappedToken === '' ) {
            return null;
        } else {
            return mappedToken;
        }
    }

    function addTokenForSubscription ( ws, uri, token ) {
        if ( typeof ws.routeTokenMap === 'undefined' ) {
            ws.routeTokenMap = {};
        }
        ws.routeTokenMap[ uri ] = token;
    }

    function removeSubscription ( ws, uri ) {
        if ( typeof ws.routeTokenMap !== 'undefined' ) {
            delete ws.routeTokenMap[ uri ];
        }
    }

    function triggerSubscribers( packet, service, id, key ) {
        // Create the url
        var uri = "/" + Array.prototype.slice.call( arguments, 1 ).join( '/' ) + "/";
        
        for( var i in wss.clients ) {
            var c = wss.clients[ i ];
            var token = tokenForSubscription( c, uri );
            if ( token !== null ) {
                // Get the packet which should have been
                // set by post or get handlers
                send( c, packet.token( token ) );
            }
        }
    }

    // ## PubSub Handlers

    // ### Trigger 
    function trigger ( route, req, client, next ) {
        if ( W.isNotOk( req.uri ) ) {
            return console.error( 'no uri provided for trigger' );
        }
        // Trigger subscribers using the packet we already have
        triggerSubscribers( req.subscriptionBroadcastPacket, route.params.service, route.params.id, route.params.key );

        // If there is a :key we also need to let :service:data subscribes know there new data
        if ( W.isOk( route.params.key ) ) {
            // Get the data for the others
            db.get( route.params.service, route.params.id )
                .success( function ( data ) {
                    req.subscriptionBroadcastPacket.body( data );
                    triggerSubscribers( req.subscriptionBroadcastPacket, route.params.service, route.params.id );
                })
                .error( function ( err ) {
                    console.error( 'Failed to get data for subscribers', err );
                });
        }
        
        next();
    }

    function subscribe ( route, req, client, next ) {
        if ( W.isNotOk( req.uri ) ) {
            return console.error( 'no uri provided for subscribe' );
        }
        addTokenForSubscription( client, req.uri, req.token || "" );
        
        // Send a response that it worked
        var packet = Packet.make()
                            .method( 'POST' )
                            .uri( req.uri )
                            .status( Packet.OK )
                            .token( req.token )
                            .body( req.body );
        send( client, packet );

        next();
    }

    function unsubscribe ( route, req, client, next ) {
        // indexof and array.splice(index, 1);
        if ( W.isNotOk( req.uri ) ) {
            return console.error( 'could not assertain uri to unsubscribe from' );
        }
        removeSubscription( client, req.uri );
        next();
    }

    // # Bind to incomming connections and messages

    wss.on( 'connection', function ( conn ) {
        console.log( 'new connection' );
        conn.on( 'message', W.bind( handleWsConnection, conn ));
        // conn.on( 'error', function ( ) { });
        // conn.on( 'close', function ( ) { });
    });

    function handleWsConnection ( data ) {
        // try to convert the data to json
        var json;
        try {
            json = JSON.parse( data );
        } catch ( e ) {
            return console.error( 'could not parse json from client connection', data );
        }
        if ( W.isOk( json.uri ) && W.isOk( json.method ) ) {
            router.trigger( json.uri, json, this ).withMethod( json.method );
        } else {
            console.error( 'client not sending uri or method in json' );
        }
    }

};


