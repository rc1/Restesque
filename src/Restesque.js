var _ = require('underscore');
var Router = require('./Router');
var utils = require('./Utils');
var action = require('./Actions');

// # Redis
var redis = require('redis');

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
        callback(obj);
    });
};


// # Restesque

function Restesque(options) {
    var self = this;
    
    this.options = options || {};
    this.options.redisDatabase = (typeof this.options.redisDatabase === 'undefined') ? 4 : this.options.redisDatabase;

    // ## Redis
    
    this.client = redis.createClient();
    this.client.select(this.options.redisDatabase, function() { 
        console.log("Using redis db 4");
    });
    this.client.on("error", function (err) {
        console.log("Redis Error " + err);
    });

    function prepareDataForSave(data) {
        if (typeof data === 'object') {
            return JSON.stringify(data);
        }
        return data;
    }   

    // ## Routing
    this.router = new Router();
    this.router

        // ### Root
        
        .map('', 'GET')
            .to(function (params, data, res, next) {
                next();
            }, this)
            .to(function (params, data, res) {
                if (data.actions.children) {
                    action.listAllServices(self.client)
                        .onError(function (err, desciption) { console.log(err, desciption); res.error(desciption); })
                        .onList(function (replies) { res.ok(replies); })
                        .run();
                    return;
                } else {
                    // get info about redis
                    self.client.parse_info(function (info) {
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
                if (data.actions.children) {
                    action.listAllIds(self.client, params.service)
                        .onError(function (err, desciption) { console.log(err, desciption); res.error(desciption); })
                        .onList(function (replies) { res.ok(replies); })
                        .run();
                    return;
                } else {
                    action.queryServiceExists(self.client, params.service)
                        .onError(function (err, desciption) { console.log(err, desciption); res.error(desciption); })
                        .onNo(function () { res.notFound('could not find '+params.service); })
                        .onYes(function () {
                            action.getServiceData(self.client, params.service)
                                .onError(function (err, desciption) { console.log(err, desciption); res.error(desciption); })
                                .onData(function (data) {
                                    res.ok(data); 
                                })
                                .run();
                        })
                        .run();
                }
            }, this)

        .map(':service/', 'PUT')
        .map(':service/', 'POST')
            .to(function (params, data, res, next) {
                next();
            }, this)
            .to(function (params, data, res) {
                var didExist = true;

                action.queryServiceExists(self.client, params.service)
                    .onError(function (err, desciption) { console.log(err, desciption); res.error(desciption); })
                    .onNo(function (then) { 
                        didExist = false;
                        action.createService(self.client, params.service)
                            .onError(function (err, desciption) { console.log(err, desciption); res.error(desciption); })
                            .then(then)
                            .run();
                    })
                    .then(function () {
                        if (data.body || !didExist) {
                            if (!didExist && !data.body) {
                                // it the data did not exit create it anyway
                                data.body = "";
                            }
                            action.setServiceData(self.client, params.service, data.body)
                                .onError(function (err, desciption) { console.log(err, desciption); res.error(desciption); })
                                .then(function () {
                                    res.ok({
                                        didExist: didExist
                                    });
                                })
                                .run();
                        } else {
                            res.ok({
                                didExist: didExist
                            });
                        }
                    })
                    .run();
            }, this)

        .map(':service/', 'DELETE')
            .to(function (params, data, res, next) {
                next();
            }, this)
            .to(function (params, data, res) {
                action.deleteService(self.client, params.service)
                    .onError(function (err, desciption) { console.log(err, desciption); res.error(desciption); })
                    .then(function () {
                        res.ok();
                    })
                    .run();
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
    
        var data = {
            actions : utils.getActionsFromString(req.originalUrl)
        };

        // only add data if it exists
        if (req.body && Object.keys(req.body).length > 0) {
            data.body = req.data;
        }

        self.router.trigger( 
            // path
            restesquePath, 
            // method
            req.method.toUpperCase(), 
            // data
            data, 
            // res
            {   ok: function (message) {
                    res.json({
                        status: "ok",
                        body: message
                    });
                },
                notFound: function (message) {
                    res.status(404);
                    res.json({
                        status: "not found",
                        body: message
                    });
                },
                error: function (message) {
                    res.status(400);
                    res.json({
                        status: "error",
                        body: message
                    });
                }
            }
        ).onNoMatch(next).onAllCallbacksDidNext(next);
    };
};

Restesque.prototype.jsonMiddleware = function (method, path, body, next) {

};

module.exports = Restesque;

