var port = 8010;
var useHeartbeat = false;
var heartbeatSpeed = 1000;
var clientHtmlPage = false;

// core modules
var _ = require("underscore");
var WebSocketServer = require('ws').Server;

// options parsing
var program = require('commander');
program
    .option('-p, --port [number]', 'port')
    .option('-c, --clientHtmlPage', 'serve HTML monitor webpage')
    .option('-s, --heartbeatSpeed [number]', 'heatbeat speed')
    .option('-b, --subscribeAllToHeartbeat', 'subscribes all new client to hearbeats')
    .parse(process.argv);

if (typeof program.subscribeAllToHeartbeat !== "undefined") { useHeartbeat = program.subscribeAllToHeartbeat; }
if (typeof program.clientHtmlPage !== "undefined") { clientHtmlPage = program.clientHtmlPage; }
if (typeof program.port === "string" || program.port === "number") {
    port = parseInt(program.port,10);
}
if (typeof program.heartbeatSpeed === "string" || program.heartbeatSpeed === "number") {
    heartbeatSpeed = parseInt(program.heartbeatSpeed,10);
}

// server creation
var wss;
if (clientHtmlPage) { 
    var http = require('http');
    var fs = require('fs');
    var htmlPage = fs.readFileSync("websocket-monitor.html");
    var server = http.createServer(function (req, res) {
      res.writeHead(200, {'Content-Type': 'text/HTML'});
      res.end(htmlPage);
    });
    server.listen(port);
    wss = new WebSocketServer({server: server});
} else {
    wss = new WebSocketServer({port: port});
}

// counters and clients
var clientCount = 0;
var heartBeatCounter = 0;
var clients = [];
var idCounter = 0;

// start the heat beat
if (useHeartbeat) {
    heartbeat();
}

// routing
var routes = [];
//  {"method":"get","resource":"/server/clients/"}
routes.push(new Route("get", "/server/clients/", function (ws, messageJSON, route, responce) {
    responce.body.clientCount = clientCount;
    ws.send(JSON.stringify(responce));
}));
//  {"method":"get","resource":"/server/crash/"}
routes.push(new Route("get", "/server/crash/", function (ws, messageJSON, route, responce) {
    process.exit();
}));
//  {"method":"put","resource":"/server/broadcast/","body":"whatever"}
routes.push(new Route("put", "/server/broadcast/", function (ws, messageJSON, route, responce) {
    responce.body = messageJSON.body;
    ws.send(JSON.stringify(responce));
    delete responce.token;
    clients.forEach(function (client) {
        if (client.ws !== ws) { 
            client.ws.send(JSON.stringify(responce));
        }
    });
}));

// websocket connections
wss.on('connection', function(ws) {
    var clientInfo = {
        ws: ws,
        cid: ++idCounter,
        errored: false
    };
    clients.push(clientInfo);
    clientCount++;

    ws.on('message', function(message) {
        var messageJSON;
        var responce;

        try {
            messageJSON = JSON.parse(message);
        } catch (e) {}

        if (messageJSON) {
            testAllRoutes(routes, ws, messageJSON);
        } 
    });

    ws.on('close', function() {
        clients = _.without(clients, clientInfo);
        --clientCount;
        logClientCount();
    });

    ws.on('error', function () {
        logClientCount();
        clientInfo.errored = true;
    });

    logClientCount();
});

function logClientCount() {
    console.log("Client count ", clientCount);
}

function heartbeat() {
    clients.forEach(function (clientInfo) {
        if (!clientInfo.errored) {
            clientInfo.ws.send('{"resource":"/heartbeat/1000/","body":{"count":"'+heartBeatCounter+'"}}');
            if (++heartBeatCounter > 100000) {
                heartBeatCounter = 0;
            }
        }
    });
    setTimeout(heartbeat, heartbeatSpeed);
}

// Mini express-esque routing

function Route(method, resource, handler) {
    this.method = method;
    this.resource = resource;
    this.handler = handler;
}

Route.prototype.trigger = function (ws, messageJSON) {
    if (messageJSON && 
        messageJSON.method &&
        messageJSON.method.toLowerCase() === this.method.toLowerCase() &&
        messageJSON.resource === this.resource ) {
        var responce = {
            "resource" : this.resource,
            "body" : {}
        };
        if (messageJSON.token) { responce.token = messageJSON.token; }
        this.handler(ws, messageJSON, this, responce);
    }
};

function testAllRoutes(routes, ws, messageJSON) {
    routes.forEach(function (route) {
        route.trigger(ws, messageJSON);
    });
}


console.log("Websocket server running on port", port);
