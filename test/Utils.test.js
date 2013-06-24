var chai = require("chai");
var expect = chai.expect;

var utils = require('./../src/Utils');

describe('removeBaseFromUrl', function () {
    describe('/api/something/', function () {
        it('should remove /api/', function () {
            expect( utils.removeBaseFromUrl("/api/", "/api/something/") ).to.equal("something/");
        });
    });

    describe('/api/something/', function () {
        it('should remove /', function () {
            expect( utils.removeBaseFromUrl("/", "/api/something/") ).to.equal("api/something/");
        });
    });

    describe('/not/there/something/', function () {
        it('should remove /', function () {
            expect( utils.removeBaseFromUrl("/api/", "/not/there/something/") ).to.equal("/not/there/something/");
        });
    });
    
});

describe('getActionsFromString', function () {
    describe('/something/?hello', function () {
        it('has truty hello', function () {
            var params = utils.getActionsFromString("/something/?hello");
            console.log("param", params);
            expect(params.hello).to.be.ok;
        });
    });
    describe('/something/?hello=ross', function () {
        it('has ross for hello', function () {
            var params = utils.getActionsFromString("/something/?hello=ross");
            console.log("param", params);
            expect(params.hello).to.equal('ross');
            console.log("params", params);
            expect(params.something).to.be.not.ok;
        });
    });
    describe('/something/?fish=ross&chip=good&ok', function () {
        it('has ross, good and ok', function () {        
            var params = utils.getActionsFromString("/something/?fish=ross&chip=good&ok");
            expect(params.fish).to.equal('ross');
            expect(params.chip).to.equal('good');
            expect(params.ok).to.be.ok;
        });
    });
});