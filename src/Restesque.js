var _ = require('underscore');
var Router = require('./Router');
var utils = require('./Utils');

// # Redis
var redis = require('redis');
var client = redis.createClient();

client.select(4, function() { 
    console.log("Using redis db 4");
});
client.on("error", function (err) {
    console.log("Redis Error " + err);
});

redis.RedisClient.prototype.parse_info = function (callback) {
    this.info(function (err, res) {
        var lines = res.toString().split("\r\n").sort();
        var obj = {};
        lines.forEach(function (line) {
            var parts = line.split(':');
            if (parts[1]) {
                obj[parts[0]] = parts[1];
            }
        });
        callback(obj)
    });
};

// # Restesque

function Restesque(options) {
    if (!options) { options = {}; }

    this.router = new Router();

    // ## Routing
    this.router

        // ### Root
        
        .map('', 'GET')
            .to(function (params, data, res, next) {
                next();
            }, this)
            .to(function (params, data, res) {
                console.log("data", data);
                if (data.actions.children) {
                    res.ok('"" worked with children');
                    return;
                } else {
                    client.parse_info(function (info) {
                        res.ok({
                            "redis" : info
                        });
                    });
                }
            }, this)

        // ### Service
        
        .map(':service/', 'GET')
            .to(function (params, data, res, next) {
                next();
            }, this)
            .to(function (params, data, res) {
                console.log("data", data);
                if (data.actions.children) {
                    res.ok('":service" worked with children');
                    return;
                } else {
                    res.ok('":service" worked');
                }
            }, this)

        .map(':service/', 'POST')
            .to(function (params, data, res, next) {
                next();
            }, this)
            .to(function (params, data, res) {
               
            }, this)

        .map(':service/', 'OUT')
            .to(function (params, data, res, next) {
                next();
            }, this)
            .to(function (params, data, res) {
                
            }, this)

        .map(':service/', 'DELETE')
            .to(function (params, data, res, next) {
                next();
            }, this)
            .to(function (params, data, res) {
                
            }, this)

        .map(':service/', 'SUBSCRIBE')
            .to(function (params, data, res, next) {
                next();
            }, this)
            .to(function (params, data, res) {

            }, this)

        .map(':service/', 'UNSUBSCRIBE')
            .to(function (params, data, res, next) {
                next();
            }, this)
            .to(function (params, data, res) {

            }, this)

        // ### Id
        
        .map(':service/:id/', 'GET')
            .to(function (params, data, res, next) {
                next();
            }, this)
            .to(function (params, data, res) {
                if (data.action.children) {
                    return;
                } 
            }, this)

        .map(':service/:id/', 'POST')
            .to(function (params, data, res, next) {
                next();
            }, this)
            .to(function (params, data, res) {

            }, this)

        .map(':service/:id/', 'OUT')
            .to(function (params, data, res, next) {
                next();
            }, this)
            .to(function (params, data, res) {

            }, this)

        .map(':service/:id/', 'DELETE')
            .to(function (params, data, res, next) {
                next();
            }, this)
            .to(function (params, data, res) {

            }, this)

        .map(':service/:id/', 'SUBSCRIBE')
            .to(function (params, data, res, next) {
                next();
            }, this)
            .to(function (params, data, res) {

            }, this)

        .map(':service/:id/', 'UNSUBSCRIBE')
            .to(function (params, data, res, next) {
                next();
            }, this)
            .to(function (params, data, res) {

            }, this)

        // ### Key
        
        .map(':service/:id/:key/', 'GET')
            .to(function (params, data, res, next) {
                next();
            }, this)
            .to(function (params, data, res) {

            }, this)

        .map(':service/:id/:key/', 'POST')
            .to(function (params, data, res, next) {
                next();
            }, this)
            .to(function (params, data, res) {

            }, this)

        .map(':service/:id/:key/', 'OUT')
            .to(function (params, data, res, next) {
                next();
            }, this)
            .to(function (params, data, res) {

            }, this)

        .map(':service/:id/:key/', 'DELETE')
            .to(function (params, data, res, next) {
                next();
            }, this)
            .to(function (params, data, res) {

            }, this)

        .map(':service/:id/:key/', 'SUBSCRIBE')
            .to(function (params, data, res, next) {
                next();
            }, this)
            .to(function (params, data, res) {

            }, this)

        .map(':service/:id/:key/', 'UNSUBSCRIBE')
            .to(function (params, data, res, next) {
                next();
            }, this)
            .to(function (params, data, res) {

            }, this)

        // ### Key number
        
        .map(':service/:id/:key/number/', 'GET')
            .to(function (params, data, res, next) {
                next();
            }, this)
            .to(function (params, data, res) {
                if (data.action.increment) {

                }
                if (data.action.decrement) {

                }
            }, this)

        .map(':service/:id/:key/number/', ['POST', 'PUT'])
            .to(function (params, data, res, next) {
                next();
            }, this)
            .to(function (params, data, res) {
                if (data.action.increment) {

                }
                if (data.action.decrement) {

                }
                if (data.action.add) {

                }
                if (data.action.subtract) {

                }
            }, this)

        .map(':service/:id/:key/number/', 'SUBSCRIBE')
            .to(function (params, data, res, next) {
                next();
            }, this)
            .to(function (params, data, res) {

            }, this)

        .map(':service/:id/:key/number/', 'UNSUBSCRIBE')
            .to(function (params, data, res, next) {
                next();
            }, this)
            .to(function (params, data, res) {

            }, this);
}

Restesque.prototype.connectMiddleware = function(options) {
    var self = this;
    if (!options) { options = {}; }
    var baseURL = options.baseURL || "/";

    return function (req, res, next) {
        var restesquePath = utils.removeBaseFromUrl(baseURL, req.path);
        console.log("router trigger", self.router.trigger( 
            // path
            restesquePath, 
            // method
            req.method.toUpperCase(), 
            // data
            {   body : req.body,
                actions : utils.getActionsFromString(req.originalUrl)
            }, 
            // res
            {   ok: function (message) {
                    res.json(message);
                }
            }
        ));
    };
};

Restesque.prototype.jsonMiddleware = function (method, path, body, next) {

};

module.exports = Restesque;

