var Restesque = require( './restesque' );
var Packet = require( './packet' );
var W = require( 'w-js' );

console.log( 'res is', Restesque );

module.exports = (function () {
    
    // # Messsages 

    function get ( connection, uri ) {
        var p = Packet
                .make()
                .uri( uri )
                .method( 'GET' );

        return Restesque.send( connection, p );
    }

    function post ( coonection, uri, body ) {
        var p = Packet
                .make()
                .uri( uri )
                .method( 'POST' )
                .body( body );

        return Restesque.send( connection, p );
    }

    function subscribe ( connection, uri, handler ) {
        var p = Packet
                .make()
                .uri( uri )
                .method( 'SUBSCRIBE' );

        return W.promise( function ( resolve, reject ) {
            Restesque.makeSubscriptionAsync( connection, p )
                .success( function ( subscribe ) {
                    subscribe.on( 'publish', handler );
                    resolve( subscribe );
                })
                .error( reject );
        });
    }

    function subscribeWithInitialGet( util, uri, handler ) {
        return W.promise( function ( resolve, reject ) {
            get( util, uri )
                .success( function ( packet ) {
                    handler( packet );
                    subscribe( util, uri, handler );
                    resolve();
                })
                .error( reject );
     	});	
    }

    // # Export

    return {
        // Messages
        get : get,
        post : post,
        subscribe : subscribe,
        subscribeWithInitialGet : subscribeWithInitialGet
    };
    
}());
