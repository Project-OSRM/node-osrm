var OSRM = require('../');
var test = require('tape');
var berlin_path = "test/data/berlin-latest.osrm";

test('nearest', function(assert) {
    assert.plan(3);
    var osrm = new OSRM(berlin_path);
    osrm.nearest([52.4224, 13.333086], function(err, result) {
        console.log(JSON.stringify(result));
        assert.ifError(err);
        assert.equal(result.mapped_coordinate.length, 2);
        assert.ok(result.hasOwnProperty('name'));
    });
});

test('nearest: throws on invalid args', function(assert) {
    assert.plan(3);
    var osrm = new OSRM(berlin_path);
    var options = {};
    assert.throws(function() { osrm.nearest(options); },
        /two arguments required/);
    assert.throws(function() { osrm.nearest(null, function(err, res) {}); },
        /first argument must be an array of lat, long/);
    options.coordinates = [52.4224];
    assert.throws(function() { osrm.nearest(options, function(err, res) {}); },
        /first argument must be an array of lat, long/);
});
