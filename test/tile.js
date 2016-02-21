var OSRM = require('../');
var test = require('tape');
var berlin_path = "test/data/berlin-latest.osrm";

test('tile', function(assert) {
    assert.plan(3);
    var osrm = new OSRM(berlin_path);
    osrm.tile({z: 15, x: 17603, y: 10747}, function(err, result) {
        assert.ifError(err);
        assert.ok(result.hasOwnProperty('pbf'));
        assert.equal(result.pbf.length, 13289);
    });
});
