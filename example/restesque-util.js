var RestesqueUtil = (function () {  

    // Can take ws or a restesque.util as first arg
    function get ( util, uri ) {
        var ws = util.connection ? util.connection : util;
        var p = Packet
                .make()
                .uri( uri )
                .method( 'GET' );

        return Restesque.send( ws, p );
    }

    // Can take ws or a restesque.util as first arg
    function post ( util, uri, body ) {
        var ws = util.connection ? util.connection : util;
        var p = Packet
                .make()
                .uri( uri )
                .method( 'POST' )
                .body( body );

        return Restesque.send( ws, p );
    }

    // Can take ws or a restesque.util as first arg
    function subscribe ( util, uri, handler ) {
        var ws = util.connection ? util.connection : util;
        var p = Packet
                .make()
                .uri( uri )
                .method( 'SUBSCRIBE' );

        return W.promise( function ( resolve, reject ) {
            Restesque.makeSubscriptionAsync( ws, p )
                .success( function ( subscribe ) {
                    subscribe.on( 'publish', handler );
                    resolve( subscribe );
                })
                .error( reject );
        });
    }

    // Can take ws or a restesque.util as first arg
    function subscribeWithInitialGet( util, uri, handler ) {
        var ws = util.connection ? util.connection : util;
         return W.promise( function ( resolve, reject ) {
            get( ws, uri )
                .success( function ( packet ) {
                    handler( packet );
                    subscribe( ws, uri, handler );
                    resolve();
                })
                .error( reject );
     });
    }

    // # Export

    return {
        get : get,
        post : post,
        subscribe : subscribe,
        subscribeWithInitialGet : subscribeWithInitialGet
    };
    
}());
