var osrm = require('osrm');
var assert = require('assert');

describe('osrm', function() {

    it('should throw if new keyword is not used', function(done) {
        assert.throws(function() { osrm.Engine("../server.ini"); },
          /Cannot call constructor as function, you need to use 'new' keyword/);
        done();
    });

    it('should throw if invalid args are passed', function(done) {
        assert.throws(function() { new osrm.Engine(99999); },
        /OSRM config path must be a string/);
        done();
    });

    // @TODO not safe yet to test: https://github.com/DennisOSRM/Project-OSRM/issues/692
    it.skip('should throw if ini file does not exist', function(done) {
        assert.throws(function() { new osrm.Engine("./test/data/bogus.ini"); },
        /@TODO/);
        done();
    });

    // @TODO - should provide better error:
    // https://github.com/DennisOSRM/Project-OSRM/commit/34735b8aad06098d09d3fb907137697799a281e4#commitcomment-3809465
    it('should throw if ini file does not exist', function(done) {
        assert.throws(function() { new osrm.Engine("doesnotexist.ini"); },
        /server.ini not found/);
        done();
    });

    it('should throw if files referenced by ini do not exist', function(done) {
        assert.throws(function() { new osrm.Engine("./test/data/references-missing-files.ini"); },
        /hsgr not found/);
        done();
    });


    // @TODO not safe yet to test: https://github.com/DennisOSRM/Project-OSRM/issues/693
    it.skip('should throw if ini port option is invalid', function(done) {
        assert.throws(function() { new osrm.Engine("./test/data/references-corrupt-files.ini"); },
        /hsgr not found/);
        done();
    });

    it('should be initialized', function(done) {
        var engine = new osrm.Engine("./test/data/berlin.ini");
        assert.ok(engine);
        done();
    });

    it('should return results for berlin using sync api', function(done) {
        var engine = new osrm.Engine("./test/data/berlin.ini");
        var start = [52.519930,13.438640];
        var end = [52.513191,13.415852];
        var query = new osrm.Query( { start: start, end: end });
        var sync_result = engine.run(query);
        engine.run(query,function(err,async_result) {
            assert.equal(sync_result,async_result);
            var result_json = JSON.parse(async_result);
            assert.equal(result_json.status_message,'Found route between points');
            done();
        });
    });
});