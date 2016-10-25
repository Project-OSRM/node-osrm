var OSRM = require('../');
var test = require('tape');
var berlin_path = "test/data/berlin-latest.osrm";

test('tile', function(assert) {
    assert.plan(2);
    var osrm = new OSRM(berlin_path);
    osrm.tile([17603, 10747, 15], function(err, result) {
        assert.ifError(err);
        assert.ok(Math.abs(result.length - 31564) < 10);
    });
});
