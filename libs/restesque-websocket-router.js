// # Modules
var W = require( 'w-js' );
var util = require( 'util' );
// ## Libs
var Packet = require( './packet.js' );

module.exports = function ( wss, db, urlRoot ) {

    if ( typeof urlRoot === 'undefined' ) {
        urlRoot = 'meta';
    }

    // # Router
    var router = new W.Router();

    // ## Map
    router
        .map( '/'+urlRoot+'/', [ 'GET', 'SUBSCRIBE', 'UNSUBSCRIBE' ] )
            .to( checkAuthenticated )
            .toWhenMethod( 'GET', get )
        .map( '/'+urlRoot+'/:id/', [ 'DELETE', 'GET', 'SUBSCRIBE', 'UNSUBSCRIBE' ] )
            .to( checkAuthenticated )
            .toWhenMethod( 'GET', get )
            .toWhenMethod( 'DELETE', del )
            .toWhenMethod( 'SUBSCRIBE', subscribe )
            //.toWhenMethod( 'DELETE', idPubSub )
        .map( '/'+urlRoot+'/:id/:key/', [ 'DELETE', 'POST', 'GET', 'SUBSCRIBE', 'UNSUBSCRIBE' ] )
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
        db.get( route.params.id, route.params.key ).done( function ( err, data ) {
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
        db.post( route.params.id, route.params.key, dataToStore ).done( function ( err, data ) {
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
        db.del( route.params.id, route.params.key ).done( function ( err, data ) {
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

    function metaPubSub ( route, req, client, next ) {
        next();
    }

    function idPubSub ( route, req, client, next ) {
        next();
    }

    function keyPubSub ( route, req, client, next ) {
        next();
    }

    // # Websocket Sending

    function send( client, packet ) {
        if ( typeof packet === 'string' ) {
            client.send( packet );
        } else if ( packet instanceof Packet ) {
            client.send( packet.getAsJsonStr() );
        }
    }

    // # PubSub

    // ## Subscribable
    // This allows clients to track what they are subscibed to, and what the tokens are

    function tokenForSubscription ( ws, uri ) {
        if ( typeof ws.routeTokenMap === 'undefined' ) {
    	return false;
        }
        return ws.routeTokenMap[ uri ];
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

    // // Mixin subscribable to the WS
    // console.log( util.inherits( Subscribable, WS ) );

    // ## PubSub Handlers

    // ### TriggerId
    // Used by `/meta/:id/:key/ to trigger client`
    function triggerId ( route, req, client, next ) {
        // - Make the `/meta/:id/` subcription url
        var idSubscribeUrl = '/meta/' + route.params.id + '/';
        // - Find if someone if subscribed to that url, or quit
        var foundMatch = false;
        for ( var i in wss.clients ) {
            if ( typeof tokenForSubscription( wss.clients[ i ], idSubscribeUrl ) !== 'undefined' ) {
                foundMatch = true;
                break; 
            }
        }
        if ( foundMatch ) {
            // - Get that subscription url from the db
            db.get( route.params.id ).done( function ( err, data ) {
                if ( err ) {
                    console.error( 'error `getting` data from db for triggerId');
                } else {
                    // - Call all the subsciber of that URL
                    // Make the packet
                    var packet = Packet.make()
                        .status( 200 )
                        .body( data )
                        .method( req.subscriptionBroadcastPacket.method )
                        .uri( req.subscriptionBroadcastPacket.uri );
                    // Send the packet out to everyont
                    for ( var i in wss.clients ) {
                        var c = wss.clients[ i ];
                        var token = tokenForSubscription( c, idSubscribeUrl );
                        if ( token !== false ) {
                            // Get the packet which should have been
                            // set by post or get handlers
                            send( c, packet.token( token ) );
                        }
                    }
                }
                next();
            });
        } else {
            console.log( 'no match found' );
            next();
        }
    }

    // ### Trigger 
    function trigger ( route, req, client, next ) {
        if ( W.isNotOk( req.uri ) ) {
            return console.error( 'no uri provided for trigger' );
        }

        for( var i in wss.clients ) {
            var c = wss.clients[ i ];
            var token = tokenForSubscription( c, req.uri );
            if ( token !== false ) {
                // Get the packet which should have been
                // set by post or get handlers
                console.log( 'trigger posting info' );
                send( c, req.subscriptionBroadcastPacket.token( token ) );
            }
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

