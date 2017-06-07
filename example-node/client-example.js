const W = require( 'w-js' );
const JSONSocketConnection = W.JSONSocketConnection();
const RestesqueUtil = require( './../libs/restesque-util-node' );

// The Websocket
const connection = new JSONSocketConnection( {
    socketUrl : 'ws://localhost:6969/'
});

// Remember to open the connection
connection.openSocketConnection();

// Do some restequse stuff when the connection opens
//  needs to be set here, the connect may open again
connection.on( 'open', onWSConnected );

connection.on( 'close', function () {
    console.log( 'close' );
});

connection.on( 'reconnecting', function () {
    console.log( 'reconnecting' );
});


// On JSONSocketConnection connected
function onWSConnected () {

    var onSubscribedOnce = W.once( onSubscribed );

    RestesqueUtil
        .subscribeWithInitialGet( connection, '/fish/chips/pizza/', function ( packet ) {
            console.log( '-- recived packet', packet );
            onSubscribedOnce();
        });
}

// On Restequse subscribed
function onSubscribed () {

    console.log( '- subscribed' );

    setTimeout( function () {

        console.log( '- posting message' );

        RestesqueUtil.post( connection, '/fish/chips/pizza/', 'hello world' );

        setTimeout( function () {

            console.log( '- will send now' );
            RestesqueUtil.now( connection, '/fish/chips/pizza/' );

        });

    }, 1000 );

}
