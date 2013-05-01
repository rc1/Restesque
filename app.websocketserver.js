var port = 8010;
var disableHeartbeat = false;
var heartbeatSpeed = 1000;
var serverHtmlPage = false;

// core modules
var _ = require("underscore");
var WebSocketServer = require('ws').Server;

// options parsing
var program = require('commander');
program
    .option('-p, --port [number]', 'Port')
    .option('-h, --htmlPage', 'Serve WebSocket HTML client test page')
    .option('-s, --heartbeatSpeed [number]', 'Hearbeat speed')
    .option('--disableHeartbeat', 'Disable periodic sending of hearbeats')
    .parse(process.argv);

if (program.htmlPage) { serverHtmlPage = true; }
if (program.disableHeartbeat) { disableHeartbeat = true; }
if (typeof program.port === "string" || program.port === "number") {
    port = parseInt(program.port,10);
}
if (typeof program.heartbeatSpeed === "string" || program.heartbeatSpeed === "number") {
    heartbeatSpeed = parseInt(program.heartbeatSpeed,10);
}

// server creation
var wss;
if (serverHtmlPage) { 
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
if (!disableHeartbeat) {
    heartbeat();
}

// routing
var routes = [];
//  {"method":"get","resource":"/clients/count/"}
routes.push(new Route("get", "/clients/count/", function (ws, messageJSON, route, responce) {
    responce.body.clientCount = clientCount;
    ws.send(JSON.stringify(responce));
}));
//  {"method":"get","resource":"/crash/"}
routes.push(new Route("get", "/crash/", function (ws, messageJSON, route, responce) {
    process.exit();
}));
//  {"method":"post","resource":"/broadcast/","body":"whatever"}
routes.push(new Route("post", "/broadcast/", function (ws, messageJSON, route, responce) {
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
            clientInfo.ws.send('{"heartbeat":"'+heartbeatSpeed+'","count":"'+heartBeatCounter+'"}');
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
