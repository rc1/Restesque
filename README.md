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
-c, --clientHtmlPage           Serve WebSocket HTML client test page
-s, --heartbeatSpeed [number]  Heatbeat speed
-b, --subscribeAllToHeartbeat  Subscribes all new client to hearbeats
```

### HTML test client webpage

To start the server with a web page featuring has a text client run with: 

```bash
node app.testwebsocketserver.js
```

An example of the test client page, which may be used on any web socket server, can be found here:  
[http://websockets.workers.io/](http://websockets.workers.io/#ws%3A%2F%2Fwebsockets.workers.io)  
_Connect to ws://websockets.workers.io/_

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
{"method":"get","resource":"/server/clients/"}
```

Which is:

```json
{
    "method" : "get",
    "resource" : "/server/clients/"
}
```

#### Response

```json
{
    "resource" : "/server/clients/",
    "body" : {
        "count" : 2
    }
}
```

### Crash the server
#### Request
Useful for testing! To crash it send the following string:

```
{"method":"get","resource":"/server/crash/"}
```

Which is:

```json
{
    "method" : "get",
    "resource" : "/server/crash/"
}
```

#### Response

Erm, none. It crashed.

### Broadcast a message
#### Request

To send a message to all connected clients, send the following string:

```
{"method":"post","resource":"/server/broadcast/","body":"whatever"}
```

Which is:

```json
{
    "method" : "post",
    "resource" : "/server/broadcast/",
    "body" : "whatever"
}
```

Whatever may be anything.

#### Response and broadcast

The following will be send to all connected clients:

```json
{
    "resource" : "/server/broadcast/",
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
    "resource" : "/heartbeat/1000/",
    "body" : {
        "count" : "4"
    }
}
```


