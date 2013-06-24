var chai = require("chai");
var expect = chai.expect;

var Router = require('./../src/Router');


describe('Router', function () {
    describe('Routes', function () {
        it('can be initialised', function () {
            var router = new Router();
            expect(router).to.be.ok;
        });
    });
    
    var router = new Router();

    var result = '';
    var extraArgTest = null;
    var extraExtraArgTest = null;
    var resultParams = {};
    var didAllNext = false;

    describe('#map', function () {
        it('Basic map returns route', function () {
            expect( router.map("somewhere") ).to.be.ok;
        });
        it('Params map returns route', function () {
            expect( router.map("/:somewhere/") ).to.be.ok;
        });
        it('Params map returns route with method', function () {
            expect( router.map("/:somewhere/", "GET") ).to.be.ok;
        });
        it('Params map returns route with method', function () {
            expect( router.map("/:somewhere/", ["GET","POST"]) ).to.be.ok;
        });
    }); 

    router = new Router();

    router
        .map("/plain/")
        .map("/")
            .to(function (params, extraArg, next) {
                result = "plain jane";
                resultParams = params;
                extraArgTest = extraArg;
                //next();
            })
            // Should be testing here. Should only happen on next
            .to(function (params, extraArg) {
                result = "plain jane the second";
                resultParams = params;
                extraArgTest = extraArg;
            })
        // .map("/test/test/test/test/?children")
        //     .to(function (params, extraArg, next) {
        //         result = "children";
        //     })
        .map("/:service/", "GET")
            .to(function (params, extraArg, next) {
                result = "get worked should have works";
                resultParams = params;
                extraArgTest = extraArg;
                next();
            })
            .to(function (params, extraArg, next) {
                result = "get worked";
                resultParams = params;
                extraArgTest = extraArg;
                next();
            })
        .map("/:service/", "POST")
            .to(function (params, extraArg) {
                result = "post worked";
                resultParams = params;
                extraArgTest = extraArg;
                next();
            })
        .map("/:service/", ["DELETE", "SUBSCRIBE"])
            .to(function (params, extraArg, next) {
                result = "delete or subscribe worked";
                resultParams = params;
                extraArgTest = extraArg;
                next();
            })
        .map("/:service/:id/", "POST")
            .to(function (params, extraArg, extraExtraArg) {
                result = "post with id worked";
                resultParams = params;
                extraArgTest = extraArg;
                extraExtraArgTest = extraExtraArg;
            });

    describe('Triggering (not testing params result)', function () {

        describe('Plain route no method', function () {
            it('should trigger', function (done) {
                router.trigger('/', null, 'boom');
                setTimeout(done, 1);
            });
            it('should have matched', function () {
                
                expect(result).to.equal("plain jane");
                expect(resultParams).to.deep.equal({});
                expect(extraArgTest).to.equal('boom');
            });
        });

        describe('Plain route multi map', function () {
            it('should trigger', function (done) {
                router.trigger('/plain/', null, 'boom');
                setTimeout(done, 1);
            });
            it('should have matched', function () {
                
                expect(result).to.equal("plain jane");
                expect(resultParams).to.deep.equal({});
                expect(extraArgTest).to.equal('boom');
            });
        });

        describe('GET with 1 params', function () {
            it('should trigger', function (done) {
                router.trigger('/woop/', 'GET', 'town');
                setTimeout(done, 1);
            });
            it('should have matched', function () {
                
                expect(result).to.equal("get worked");
                expect(resultParams).to.deep.equal({service:'woop'});
            });
        });

        describe('DELETE with 1 params', function () {
            it('should trigger', function (done) {
                router.trigger('/hoop/', 'DELETE', 'rats').onAllCallbacksDidNext(function () {
                    didAllNext = "did all next";
                    done();
                });
            });
            it('should have matched', function () {
                
                expect(result).to.equal("delete or subscribe worked");
                expect(resultParams).to.deep.equal({service:'hoop'});
                expect(didAllNext).to.equal("did all next");
            });
        });

        describe('SUBSCRIBE with 1 params', function () {
            it('should trigger', function (done) {
                router.trigger('/shoop/', 'SUBSCRIBE', 'rats');
                setTimeout(done, 0);
            });
            it('should have matched', function () {
                expect(result).to.equal("delete or subscribe worked");
                expect(resultParams).to.deep.equal({service:'shoop'});
            });
        });

        describe('POST with 2 params', function () {
            it('should trigger', function (done) {
                router.trigger('/space/cadet/', 'POST', 'led', 'zepplin');
                setTimeout(done, 0);
            });
            it('should have matched', function () {
                expect(result).to.equal("post with id worked");
                expect(resultParams).to.deep.equal({service:'space', id:'cadet'});
                expect(extraArgTest).to.equal("led");
                expect(extraExtraArgTest).to.equal("zepplin");
            });
        });

        describe('POST with 3 params', function () {
            it('should trigger no match', function (done) {
                router.trigger('/space/cadet/boom/', 'POST').onNoMatch(function () {
                    result = "noMatch";
                    done();
                });
            });
            it('should call noMatch', function () {
                expect(result).to.equal("noMatch");
            });
        });

        // describe('Should trigger ?children', function () {
        //     it('should trigger', function (done) {
        //         router.trigger('/test/test/test/test/?children', null, 'boom');
        //         setTimeout(done, 1);
        //     });
        //     it('should have matched', function () {
        //         expect(result).to.equal("children");
        //     });
        // });

    });

    describe('Without inital slash', function () {

        before(function () {
            router = new Router();
            result = "";
            
            router
                .map('')
                    .to(function (params) {
                        result = "nothing";
                    })
                .map(':param1')
                    .to(function (params) {
                        result = "no slashes";
                    })
                .map(':param1/')
                    .to(function (params) {
                        result = "no leading slash, trailing slash";
                    })
                .map(':param1/:param2/')
                    .to(function (params) {
                        result = "no leading slash, trailing slash, 2 params";
                    });
        });

        describe('Empty string map', function () {
            it('should trigger', function (done) {
                router.trigger('');
                setTimeout(done, 1);
            });
            it('should have matched', function () {
                expect(result).to.equal("nothing");
            });
        });

        describe('Plain route no method', function () {
            it('should trigger', function (done) {
                router.trigger('something');
                setTimeout(done, 1);
            });
            it('should have matched', function () {
                expect(result).to.equal("no slashes");
            });
        });

        describe('Plain route no method', function () {
            it('should trigger', function (done) {
                router.trigger('something/');
                setTimeout(done, 1);
            });
            it('should have matched', function () {
                expect(result).to.equal("no leading slash, trailing slash");
            });
        });

        describe('Plain route no method', function () {
            it('should trigger', function (done) {
                router.trigger('something/else/');
                setTimeout(done, 1);
            });
            it('should have matched', function () {
                expect(result).to.equal("no leading slash, trailing slash, 2 params");
            });
        });
    

    });

});

