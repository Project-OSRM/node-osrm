var osrm = require('../');
var assert = require('assert');

describe('osrm', function() {

    it('should throw if new keyword is not used', function(done) {
        assert.throws(function() { osrm.Query(); },
          /Cannot call constructor as function, you need to use 'new' keyword/);
        assert.throws(function() { osrm.Engine(); },
          /Cannot call constructor as function, you need to use 'new' keyword/);
        done();
    });

    it('should throw if necessary files do not exist', function(done) {
        assert.throws(function() { new osrm.Engine("missing.osrm"); },
            /hsgr file does not exist/);
        done();
    });

    it('should throw if insufficient coordinates given', function() {
        assert.throws(function() {
            new osrm.Query({coordinates: []});
        });
    });

    it('should return results for berlin using sync api', function(done) {
        var engine = new osrm.Engine("berlin-latest.osrm");
        var query = new osrm.Query({coordinates: [[52.519930,13.438640], [52.513191,13.415852]]});
        var sync_result = engine.run(query);
        engine.run(query,function(err,async_result) {
            assert.equal(sync_result,async_result);
            var result_json = JSON.parse(async_result);
            assert.equal(result_json.status_message,'Found route between points');
            done();
        });
    });

    it.skip('should return results for berlin using sync api and shared memory', function(done) {
        var engine = new osrm.Engine();
        var query = new osrm.Query({coordinates: [[52.519930,13.438640], [52.513191,13.415852]]});
        var sync_result = engine.run(query);
        engine.run(query,function(err,async_result) {
            assert.equal(sync_result,async_result);
            var result_json = JSON.parse(async_result);
            assert.equal(result_json.status_message,'Found route between points');
            done();
        });
    });

    it('should return results for berlin using options', function(done) {
        var engine = new osrm.Engine("berlin-latest.osrm");
        var query = new osrm.Query({
            coordinates: [[52.519930,13.438640], [52.513191,13.415852]],
            zoomLevel: 17,
            alternateRoute: false,
            printInstructions: false
        });
        engine.run(query,function(err,async_result) {
            var result_json = JSON.parse(async_result);
            assert.equal(result_json.status_message,'Found route between points');
            assert.equal(0, result_json.route_instructions.length, "instructions should be empty");
            assert.equal(0, result_json.alternative_geometries.length, "alternative_geometries should be empty");
            done();
        });
    });

    it('should return results for berlin using hints', function(done) {
        var engine = new osrm.Engine("berlin-latest.osrm");
        var query = new osrm.Query({
            coordinates: [[52.519930,13.438640], [52.513191,13.415852]],
            alternateRoute: false,
            printInstructions: false
        });
        engine.run(query,function(err,first_result) {
            var result_json = JSON.parse(first_result);
            assert.equal(result_json.status_message,'Found route between points');
            var checksum = result_json.hint_data.checksum;
            assert.equal("number", typeof(checksum), "checksum should be a number");

            var query2 = new osrm.Query({
                coordinates: [[52.519930,13.438640], [52.513191,13.415852]],
                hints: result_json.hint_data.locations,
                alternateRoute: false,
                printInstructions: false,
                checksum: checksum
            });
            engine.run(query2,function(err,second_result) {
                assert.equal(first_result,second_result);
                var result_json = JSON.parse(second_result);
                assert.equal(result_json.status_message,'Found route between points');
                done();
            });
        });
    });

    it('should return results for "nearest" using options', function(done) {
        var engine = new osrm.Engine("berlin-latest.osrm");
        var query = new osrm.Query({
            service: "nearest",
            coordinates: [[52.4224,13.333086]]
        });
        engine.run(query,function(err,async_result) {
            var result_json = JSON.parse(async_result);
            assert.equal(result_json.status, 0,'status code should be 0');
            assert.equal(result_json.mapped_coordinate.length, 2, "mapped coordinates should exist");
            assert(result_json.hasOwnProperty('name'), "street name should exist")
            done();
        });
    });

    it('should return results for "locate" using options', function(done) {
        var engine = new osrm.Engine("berlin-latest.osrm");
        var query = new osrm.Query({
            service: "locate",
            coordinates: [[52.4224,13.333086]]
        });
        engine.run(query,function(err,async_result) {
            var result_json = JSON.parse(async_result);
            assert.equal(result_json.status, 0,'status code should be 0');
            assert.equal(result_json.mapped_coordinate.length, 2, "mapped coordinates should exist");
            done();
        });
    });
});
