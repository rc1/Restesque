var Restesque = require( './restesque' );
var Packet = require( './packet' );
var W = require( 'w-js' );

module.exports = (function () {

    // # Messsages

    function get ( connection, uri ) {
        var p = Packet
                .make()
                .uri( uri )
                .method( 'GET' );

        return Restesque.send( connection, p );
    }

    function post ( connection, uri, body ) {
        var p = Packet
                .make()
                .uri( uri )
                .method( 'POST' )
                .body( body );

        return Restesque.send( connection, p );
    }

    function now ( connection, uri, body ) {
        var p = Packet
                .make()
                .uri( uri )
                .method( 'NOW' );

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

    function subscribeWithInitialGet( connection, uri, handler ) {
        return W.promise( function ( resolve, reject ) {
            get( connection, uri )
                .success( function ( packet ) {
                    handler( packet );
                    subscribe( connection, uri, handler );
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
        now : now,
        subscribe : subscribe,
        subscribeWithInitialGet : subscribeWithInitialGet
    };

}());
