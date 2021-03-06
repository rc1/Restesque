
// # Exports

module.exports = {
    listAllServices : listAllServices,
    listAllIds : listAllIds,
    queryServiceExists : queryServiceExists,
    getServiceData : getServiceData,
    createService : createService,
    setServiceData : setServiceData,
    deleteService : deleteService
};

// # Actions

// ## List

function listAllServices(client) {
    var promise = new ActionPromise();
    promise._run = function () {
        client.smembers('rest:services', function (err, replies) {
            if (err) {
                promise._onError(err, "failed to get list of all services");
                return;
            }
            promise._onList(replies);
        });
    };
    return promise;
}

function listAllIds(client, service) {
    var  promise = new ActionPromise();
    promise._run = function () {
        client.smembers('rest:ids:'+service, function (err, replies) {
            if (err) {
                promise._onError(err, "failed to get list of all ids");
                return;
            }
            promise._onList(replies);
        });
    };
    return promise;
}

// ## Exists

function queryServiceExists(client, service) {
    var promise = new ActionPromise();
    promise._run = function () {
        client.sismember('rest:services', service, function (err, reply) {
            if (err) {
                promise._onError(err, "failed to query if service exists");
                return;
            }
            if (reply) {
                promise._onYes(promise._then);
            } else {
                promise._onNo(promise._then);
            }
        });
    };
    return promise;
}

function queryIdExists(client, service, id) {
    var promise = new ActionPromise();
    promise._run = function () {
        client.sismember('rest:ids:'+service, id, function (err, reply) {
            if (err) {
                promise._onError(err, "failed to query if id exists");
                return;
            }
            if (reply) {
                promise._onYes(promise._then);
            } else {
                promise._onNo(promise._then);
            }
        });
    };
    return promise;
}

// ## Get

function getServiceData(client, service) {
    var promise = new ActionPromise();
    promise._run = function () {
        client.get('rest:dservice:'+service, function (err, reply) {
            if (err) {
                promise._onError(err, "failed to get service data");
                return;
            }
            try {
                reply = JSON.parse(reply);
            } catch (e) {

            }
            promise._onData(reply);
        });
    };
    return promise;
}

function getIdData(client, service, id) {
    var promise = new ActionPromise();
    promise._run = function () {
        client.get('rest:did:'+service+":"+id, function (err, reply) {
            if (err) {
                promise._onError(err, "failed to get if id exists");
                return;
            }
            try {
                reply = JSON.parse(reply);
            } catch (e) {

            }
            promise._onData(reply);
        });
    };
    return promise;
}

// ## Create

function createService(client, service) {
    var promise = new ActionPromise();
    promise._run = function () {
        client.sadd('rest:services', service, function (err) {
            if (err) {
                promise._onError(err, "failed to create service");
                return;
            }
            promise._then();
        });
    };
    return promise;
}

function createId(client, service, id) {
    var promise = new ActionPromise();
    promise._run = function () {
        client.sadd('rest:ids:'+service, id, function (err) {
            if (err) {
                promise._onError(err, "failed to create id");
                return;
            }
            promise._then();
        });
    };
    return promise;
}

// ## Set

function setServiceData(client, service, data) {
    var promise = new ActionPromise();
    promise._run = function () {
        if (typeof data === 'object') {
            data = JSON.stringify(data);
        } else if (typeof data === 'number') {
            data = ""+data;
        } else if (typeof data !== 'string') {
            promise._onError(err, "data not provided as object, string or number");
            return;
        }
        client.set('rest:dservice:'+service, data, function (err) {
            if (err) {
                promise._onError(err, "failed to set service data");
                return;
            }
            promise._then();
        });
    };
    return promise;
}

function setIdData(client, service, id, data) {
    var promise = new ActionPromise();
    promise._run = function () {
        if (typeof data === 'object') {
            data = JSON.stringify(data);
        } else if (typeof data === 'number') {
            data = ""+data;
        } else if (typeof data !== 'string') {
            promise._onError(err, "data not provided as object, string or number");
            return;
        }
        client.set('rest:dids:'+service+":"+id, data, function (err) {
            if (err) {
                promise._onError(err, "failed to set id data");
                return;
            }
            promise._then();
        });
    };
    return promise;
}

// ## Delete

function deleteService(client, service) {
    var promise = new ActionPromise();
    promise._run = function () {
        console.log("@incomplete deleteService: needs to delete all ids, keys, numbers");
        client.del("rest:dservice:"+service, function (err) {
            if (err) { promise._onError(err, "failed to delete service on delete service data"); return; }
            client.srem("rest:services", service, function () {
                if (err) { promise._onError(err, "failed to delete service on remove service from set "); return; }
                promise._then();          
            });
        });
    };
    return promise;
}

function deleteId(client, service, id) {
    var promise = new ActionPromise();
    promise._run = function () {
        console.log("@incomplete deleteId: needs to delete all services, keys, numbers");
        client.del("rest:did:"+service+":"+id, function (err) {
            if (err) { promise._onError(err, "failed to delete id on delete id data"); return; }
            client.srem("rest:ids:"+service, service, function () {
                if (err) { promise._onError(err, "failed to delete id on remove service from set "); return; }
                promise._then();          
            });
        });
    };
    return promise;
}


// # Action Promise

var noop = function () {};
var thenNoop = function (then) { if (typeof then === 'function') { then(); } };

function ActionPromise() {
    this._run = noop;
    this._onYes = thenNoop;
    this._onNo = thenNoop;
    this._then = noop;
    this._onError = noop;
    this._onList = noop;
    this._onData = noop;

    this.client = undefined;
    this.service = undefined;
    this.id = undefined;
}

ActionPromise.prototype.run =  function () {
    this._run();
    return this;
};

// callback should be fn(then);
ActionPromise.prototype.onNo = function (fn) {
    this._onNo = fn;
    return this;
};

// callback should be fn(then);
ActionPromise.prototype.onYes = function (fn) {
    this._onYes = fn;
    return this;
};

ActionPromise.prototype.then = function (fn) {
    this._then = fn;
    return this;
};

ActionPromise.prototype.onData = function (fn) {
    this._onData = fn;
    return this;
};

// callback to on error should be fn(err, description);
ActionPromise.prototype.onError = function (fn) {
    this._onError = fn;
    return this;
};

// callback to on error should be fn(list);
ActionPromise.prototype.onList = function (fn) {
    this._onList = fn;
    return this;
};

