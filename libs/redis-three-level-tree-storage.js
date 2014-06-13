// A redis three level tree storage system
//
// __warining, prone to race conditions__ need to move transactions in Lua
// 
// #Data/Key Model
//
//     'service'<set> [
//        'service':id<set>... [
//            'service':id:key<hash>... data
//        ]
//      ]

// #Modules
var W = require( 'w-js' );

function RedisThreeLevelTreeStorage( redisClient, rootKey ) {
    
    // #Helpers 
    // Generating the redis keys
    var makeKey; // Function

    if ( typeof rootKey !== 'undefined' ) {
        makeKey = W.partial( W.makeRedisKey, rootKey );
    } else {
        makeKey = W.partial( W.makeRedisKey, 'rtq' );
    }

    this.post = post;
    this.del = del;
    this.get = get;

    // ##Post
    // * service <string>
    // * id <string>
    // * key <string>
    // * data <string>
    function post ( service, id, key, data ) {
        return W.Promise( function ( resolve, reject ) {
            // - add `meta:id` to the `meta` set
            // - add `meta:id:key` to the `meta:id` set
            // - set data `meta:id:key` to the hash set
            redisClient.multi()
                .sadd( makeKey( service ), makeKey( service, id ) )
                .sadd( makeKey( service, id ), makeKey( service, id, key ) )
                .set( makeKey( service, id, key ), data )
                .exec(function (err, replies) {
                    if ( err ) {
                        return reject( err );
                    }
                    resolve();
                });
        });
    }

    // ##Del
    // * service <string>
    // * id <string>
    // * key <string> optional
    function del ( service, id, key ) {
        return W.Promise( function ( resolve, reject ) {

            if ( typeof id === 'undefined' && typeof key === 'undefined' ) {
                return reject( new Error('del passed no id or key') );
            }
            // - if there is a key
            //   - delete `meta:id:key`
            //   - remove `meta:id:key` in `meta:id` set
            // - and if there is only an id
            //   - delete every key in `meta:id:key` set
            //   - delete `meta:id:key` set
            //   - delete `meta:id` in `meta`
            
            if ( typeof key !== 'undefined' ) {
                redisClient.multi()
                    .del( makeKey( service, id, key ) )
                    .srem( makeKey( service, id ), makeKey( service, id, key ) )
                    .exec( function ( err, replies ) {
                            if ( err ) {
                                return reject( err );
                            }
                            resolve();
                        });
            } else if ( typeof id !== 'undefined' ) {
                redisClient
                    .smembers( makeKey( service, id ), function ( err, savedKeys ) {
                        if ( err ) {
                            return reject( err );
                        }
                        var multi = redisClient.multi();
                        savedKeys.forEach( function ( savedKey ) {
                            multi.del( savedKey );
                        });
                        multi.del( makeKey( service, id ) );
                        multi.srem( makeKey( service ), makeKey( service, id ) );
                        multi.exec( function ( err, replies ) {
                            if ( err ) {
                                return reject( err );
                            }
                            resolve();
                        });
                    });
            } else {
                return reject( new Error('Cant delete everything.') );
            }
        });
    }

    // ##Get
    // * service <string>
    // * id <string> optional
    // * key <string> optional
    function get ( service, id, key ) {
        return W.Promise( function ( resolve, reject ) {
            // - if there is a key
            //   - return `meta:id:key`
            // - if there is an id only
            //   - return each value for key in set `meta:id`
            // - if there is no args
            //   -return each value for key in set `meta:id` for each value for key in `meta` 
            if ( typeof key !== 'undefined' ) {
                redisClient
                    .get( makeKey( service, id, key ), function ( err, data ) {
                        if ( err ) {
                            return reject( err );
                        } 
                        return resolve( data );
                    });
            } else if ( typeof id !== 'undefined' ) {
                redisClient
                    .smembers( makeKey( service, id ), function ( err, savedKeys ) {
                        if ( err ) {
                            return reject( err );
                        }
                        var results = [];
                        var multi = redisClient.multi();
                        savedKeys.forEach( function ( savedKey ) {
                            results.push( savedKey );
                            multi.get( savedKey );
                        });
                        multi.exec( function ( err, replies ) {
                            if ( err ) {
                                return reject( err );
                            }
                            results = results.reduce( function ( acc, key, i ) {
                                acc[ getLastComponent( key ) ] = replies[ i ];
                                return acc;
                            }, {});
                            return resolve( results );      
                        }, {});
                    });
            } else {
                // This should be functional, grr
                redisClient
                    // Get all the `id`s stored in meta
                    .smembers( makeKey( service ), function ( err, savedIds ) {
                        if ( err ) {
                            return reject( err );
                        }
                        var results = {};
                        var multi = redisClient.multi();
                        savedIds.forEach( function ( savedId ) {
                            results[ savedId ] = [];
                            multi.smembers( savedId );
                        });
                        // get all the 'keys'
                        multi.exec( function ( err, savedKeys ) {
                            if ( err ) {
                                return reject( err );
                            }
                            var multi = redisClient.multi();
                            results = Object.keys(results).reduce( function (acc, savedId, i) {
                                acc[ savedId ] = savedKeys[ i ];
                                savedKeys[ i ].forEach( function ( k ) {
                                     multi.get( k );
                                });
                                return acc;
                            }, {});
                            multi.exec( function ( err, data ) {
                                if ( err ) {
                                    return reject( err );
                                }
                                var i = 0;
                                results = Object.keys(results).reduce( function ( acc, id ) {
                                    acc[ getLastComponent(id) ] = results[ id ].reduce( function ( acc, key ) {
                                        acc[ getLastComponent(key) ] =  data[ i++ ];
                                        return acc;
                                    }, {});
                                    return acc;
                                }, {});
                                return resolve( results );
                            });

                        });
                    });
            }
        });
    }
}

// # Utils

function getLastComponent( str ) {
    var split = str.split(':');
    return split[split.length-1];
}

// #Exports
module.exports = RedisThreeLevelTreeStorage;
