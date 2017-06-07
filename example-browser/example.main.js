$(function () {
    console.log( 'Restesque Example' );

    var connection = new W.JSONSocketConnection( {
        socketUrl : 'ws://localhost:6969/'
    });

    // Remember to open the connection
    connection.openSocketConnection();

    connection.on( 'open', function () {
        console.log( 'open' );
        initRestesqueClient( connection );
    });


    connection.on( 'close', function () {
        console.log( 'close' );
    });

    connection.on( 'reconnecting', function () {
        console.log( 'reconnecting' );
    });

    // connection.on( 'json', function ( data ) {
    //    console.log( data );
    // }); 


});

function initRestesqueClient( connection ) {

    // ## Tests

    // Preodically update something
    // doPeriodicPost( '/meta/test/1/', 2000 );
    // doPeriodicPost( '/meta/test/2/', 1500 );

    // And subscribe to them
    // doSubscription( '/meta/test/1/', '1' );

    //setTimeout( function () {
    // doSubscription( '/meta/test/2/', '2' );
    //}, 1000 );

    // ## Posts

    doPost( '/meta/test/1/' );
    doPost( '/meta/test/2/' );

    function doPost( uri ) {
        var packet = Packet
                        .make()
                        .method( 'POST' )
                        .uri( uri )
                        .body( Math.random() );

        Restesque.send( connection, packet )
            .error( function (err) { console.log('err',uri, err); } )
            .success( function (err) { console.log('success',uri ); } )
    }

    function doPeriodicPost ( uri, time ) {
         
        setInterval( function () {
            var packet = Packet
                            .make()
                            .method( 'POST' )
                            .uri( uri )
                            .body( Math.random() );

            Restesque.send( connection, packet );

        }, time );
    }

    // ## Subscriptions


    function doSubscription ( uri, token ) {

        console.log( 'attempting to subscribe to', uri );

        // Create a subsciption
        var packet = Packet
                        .make()
                        .method( 'SUBSCRIBE' )
                        .token( token ) // not needed
                        .uri( uri );

        Restesque.makeSubscriptionAsync( connection, packet )
            .error( function ( err ) {
                console.log( 'failed to make a subscription', err );
            })
            .success( function ( subscription ) {

                console.log( 'subscribed to', uri );

                // Listen for publishes
                subscription.on( 'publish', function ( packet ) {
                    console.log( uri, 'published', packet.getBody() );
                });

            });
    }
}