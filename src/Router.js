var _ = require('underscore');
var utils = require('./Utils.js');

// Borrowed from express.js
// @todo add attributation

var noOp = function (){};

// # Route

function Router () {
    this.routes = [];
    this.noMatch = null;
}

Router.prototype.trigger = function (path, method) {
    var self = this;
    var triggerArguments = arguments;
    if (typeof method === 'undefined' || method === null) { method = 'none'; }
    var matchingRoute = _.find(this.routes, function (route) {
        return (route.method === method && route.match(path));
    });
    var promise = new RouterTriggerPromise(noOp,noOp);

    setTimeout((function (matchingRoute, promise) {
        return function () {
            if (matchingRoute) {
                utils.sequentialLoop(matchingRoute.callbacks.length, function (i, next, end) {
                    var callback = matchingRoute.callbacks[i];
                    // convert the array with keys back to an object
                    var params = {};
                    Object.keys(matchingRoute.params).forEach(function (key) {
                        params[key] = matchingRoute.params[key];
                    });
                    var args = [params];
                    for (var j=2; j<triggerArguments.length; j++) {
                        args.push(triggerArguments[j]);
                    }
                    args.push(next);
                    callback.apply(this, args);
                }, function () {
                    promise.allCallbacksDidNext();
                });
            } else {
                promise.noMatch();
            }
        };
    }(matchingRoute, promise)),0);

    return promise;
};

Router.prototype.map = function (path, methods) {
    var routerContext = this;
    var routes = [];

    if (typeof methods === 'undefined' || methods === null) { methods = ['none']; }
    if (typeof methods === 'string') { methods = [methods]; } 

    methods.forEach(function (method) {   
        routes.push( new Route(method, path, [], {sensitive:true, strict:true}) );
    });

    this.routes = this.routes.concat(routes);

    return new RouterMapPromise(routes, routerContext);

};

function RouterTriggerPromise(allCallbacksDidNext, onNoMatch) {
    this.allCallbacksDidNext = allCallbacksDidNext;
    this.onAllCallbacksDidNext = function (fn) {
        this.allCallbacksDidNext = fn;
    };
    this.noMatch = onNoMatch;
    this.onNoMatch = function (fn) {
        this.noMatch = fn;
    };
}

function RouterMapPromise(routes, routerContext) {
    var self = this;
    this.to = function (fn) {
        routes.forEach(function (route) {
            route.callbacks.push(fn);
        });
        return self;
    };
    this.map = function () {
        return routerContext.map.apply(routerContext, arguments);
    };
    this.trigger = function () {
        return routerContext.trigger.apply(routerContext, arguments);
    };
    return this;
}

/**
 * Initialize `Route` with the given HTTP `method`, `path`,
 * and an array of `callbacks` and `options`.
 *
 * Options:
 *
 *   - `sensitive`    enable case-sensitive routes
 *   - `strict`       enable strict matching for trailing slashes
 *
 * @param {String} method
 * @param {String} path
 * @param {Array} callbacks
 * @param {Object} options.
 * @api private
 */

function Route(method, path, callbacks, options) {
  options = options || {};
  this.path = path;
  this.method = method;
  this.callbacks = callbacks;
  this.regexp = pathRegexp(path, this.keys = [], options.sensitive, options.strict);
}

/**
 * Check if this route matches `path`, if so
 * populate `.params`.
 *
 * @param {String} path
 * @return {Boolean}
 * @api private
 */

Route.prototype.match = function(path){
    var keys = this.keys;
    var params = this.params = [];
    var m = this.regexp.exec(path);

    if (!m) return false;

    for (var i = 1, len = m.length; i < len; ++i) {
        var key = keys[i - 1];

        var val = 'string' == typeof m[i]
            ? decodeURIComponent(m[i])
            : m[i];
    //var val = m[i];

        if (key) {
            params[key.name] = val;
        } else {
            params.push(val);
        }
  }

  return true;
};

// Borrowed from express utils

function pathRegexp(path, keys, sensitive, strict) {
    if (toString.call(path) == '[object RegExp]') return path;
    if (Array.isArray(path)) path = '(' + path.join('|') + ')';
    path = path
        .concat(strict ? '' : '/?')
        .replace(/\/\(/g, '(?:/')
        .replace(/(\/)?(\.)?:(\w+)(?:(\(.*?\)))?(\?)?(\*)?/g, function(_, slash, format, key, capture, optional, star){
            keys.push({ name: key, optional: !! optional });
            slash = slash || '';
            return ''
                + (optional ? '' : slash)
                + '(?:'
                + (optional ? slash : '')
                + (format || '') + (capture || (format && '([^/.]+?)' || '([^/]+?)')) + ')'
                + (optional || '')
                + (star ? '(/*)?' : '');
        })
        .replace(/([\/.])/g, '\\$1')
        .replace(/\*/g, '(.*)');
    return new RegExp('^' + path + '$', sensitive ? '' : 'i');
}



// # Export
module.exports = Router;