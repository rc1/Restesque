# Basic REST-esque WebSocket Test Server

## To install

```bash
git clone git@github.com:rc1/WebSocketTestServer.git
cd WebSocketTestServer
npm install
```

### Starting

```bash
node app.websocketserver.js
```

#### Optional command line arguments

```bash
Usage: app.testwebsocketserver.js [options]

Options:

-h, --help                     output usage information
-p, --port [number]            Port
-h, --htmlPage                 Serve WebSocket HTML client test page
-s, --heartbeatSpeed [number]  Hearbeat speed
--disableHeartbeat             Disables periodic sending of heatbeats
```

### HTML test client webpage

To start the server with a web page featuring has a text client run with: 

```bash
node app.testwebsocketserver.js
```

## Concept
Allow clients to connect the send and receive JSON messages. 

Clients can send __request__ messages by sending a small JSON string. Each messages should contain a __method__ parameter (`get` or `post`) and a __resource__ address. It may also optionally contain a __token__ and/or __body__ parameter.

The structure of a request follows this format

```javascript
{   
    "method" : "get", // or "post" 
    "resource" : "/some/urls",
    "body" : ..., // any kind of content
    "token" : "0123"
}
```

## Resources
### Getting a count of all clients
#### Request
To get a list of all clients, send the server the following string:

```
{"method":"get","resource":"/clients/count/"}
```

Which is:

```json
{
    "method" : "get",
    "resource" : "/clients/count/"
}
```

#### Response

```json
{
    "resource" : "/clients/count/",
    "body" : {
        "clientCount" : 1
    }
}
```

### Crash the server
#### Request
Useful for testing! To crash it send the following string:

```
{"method":"get","resource":"/crash/"}
```

Which is:

```json
{
    "method" : "get",
    "resource" : "/crash/"
}
```

#### Response

Erm, none. It crashed.

### Broadcast a message
#### Request

To send a message to all connected clients, send the following string:

```
{"method":"post","resource":"/broadcast/","body":"whatever"}
```

Which is:

```json
{
    "method" : "post",
    "resource" : "/broadcast/",
    "body" : "whatever"
}
```

Whatever may be anything.

#### Response and broadcast

The following will be send to all connected clients:

```json
{
    "resource" : "/broadcast/",
    "body" : "whatever"
}
```

_If the request send by the client has a token, the response to the client will contain the token, but the broadcast to other clients will not contain the token._

## Tokens

Tokens, which are optional and may be of any format, will be sent back in response to client. This is here as a utility in case the connected client want to assign have different handlers for different responses.

## Heartbeat

Clients will be periodically send a heartbeat message. The heartbeat message has a counter when counts from 0 to 100000.

The message is as follows:

```json
{
    "heartbeat" : {
        "speed" : "1000",
        "count" : "4"
    }
}
```


