var OSRM = require('../');
var test = require('tape');
var berlin_path = "test/data/berlin-latest.osrm";

test('match: match in Berlin', function(assert) {
    assert.plan(5);
    var osrm = new OSRM(berlin_path);
    var options = {
        coordinates: [[52.542648,13.393252], [52.543079,13.394780], [52.542107,13.397389]],
        timestamps: [1424684612, 1424684616, 1424684620]
    };
    osrm.match(options, function(err, response) {
        assert.ifError(err);
        assert.equal(response.matchings.length, 1);
        assert.ok(response.matchings.every(function(m) {
            return !!m.distance && !!m.duration && Array.isArray(m.legs) && !!m.geometry && m.confidence > 0;
        }))
        assert.equal(response.tracepoints.length, 3);
        assert.ok(response.tracepoints.every(function(t) {
            return !!t.hint && !isNaN(t.matchings_index) && !isNaN(t.waypoint_index) && !!t.name;
        }));
    });
});

test('match: match in Berlin without timestamps', function(assert) {
    assert.plan(3);
    var osrm = new OSRM(berlin_path);
    var options = {
        coordinates: [[52.542648,13.393252], [52.543079,13.394780], [52.542107,13.397389]]
    };
    osrm.match(options, function(err, response) {
        assert.ifError(err);
        assert.equal(response.tracepoints.length, 3);
        assert.equal(response.matchings.length, 1);
    });
});

test('match: match in Berlin with geometry compression', function(assert) {
    assert.plan(3);
    var osrm = new OSRM(berlin_path);
    var options = {
        coordinates: [[52.542648,13.393252], [52.543079,13.394780], [52.542107,13.397389]]
    };
    osrm.match(options, function(err, response) {
        assert.ifError(err);
        assert.equal(response.matchings.length, 1);
        assert.equal('string', typeof response.matchings[0].geometry);
    });
});

test('match: match in Berlin without geometry compression', function(assert) {
    assert.plan(4);
    var osrm = new OSRM(berlin_path);
    var options = {
        coordinates: [[52.542648,13.393252], [52.543079,13.394780], [52.542107,13.397389]],
        geometries: 'geojson'
    };
    osrm.match(options, function(err, response) {
        assert.ifError(err);
        assert.equal(response.matchings.length, 1);
        assert.ok(response.matchings[0].geometry instanceof Object);
        assert.ok(Array.isArray(response.matchings[0].geometry.coordinates));
    });
});

test('match: match in Berlin with all options', function(assert) {
    assert.plan(4);
    var osrm = new OSRM(berlin_path);
    var options = {
        coordinates: [[52.542648,13.393252], [52.543079,13.394780], [52.542107,13.397389]],
        timestamps: [1424684612, 1424684616, 1424684620],
        radiuses: [4.07, 4.07, 4.07],
        steps: false,
        overview: 'false',
        geometries: 'geojson'
    };
    osrm.match(options, function(err, response) {
        assert.ifError(err);
        assert.equal(response.matchings.length, 1);
        assert.equal(response.matchings[0].confidence > 0, true);
        assert.equal(undefined, response.matchings[0].geometry);
    });
});

test('match: throws on missing arguments', function(assert) {
    assert.plan(1);
    var osrm = new OSRM(berlin_path);
    assert.throws(function() { osrm.match({}) },
        /two arguments required/);
});

test('match: throws on non-object arg', function(assert) {
    assert.plan(1);
    var osrm = new OSRM(berlin_path);
    assert.throws(function() { osrm.match(null, function(err, response) {}) },
        /first arg must be an object/);
});

test('match: throws on invalid coordinates param', function(assert) {
    assert.plan(4);
    var osrm = new OSRM(berlin_path);
    var options = {
        coordinates: ''
    };
    assert.throws(function() { osrm.match(options, function(err, response) {}) },
        "coordinates must be an array of (lat/long) pairs");
    options.coordinates = [[52.542648,13.393252]];
    assert.throws(function() { osrm.match(options, function(err, response) {}) },
        /at least two coordinates must be provided/);
    options.coordinates = [52.542648,13.393252];
    assert.throws(function() { osrm.match(options, function(err, response) {}) },
        "coordinates must be an array of (lat/long) pairs");
    options.coordinates = [[52.542648],[13.393252]];
    assert.throws(function() { osrm.match(options, function(err, response) {}) },
        "coordinates must be an array of (lat/long) pairs");
});

test('match: throws on invalid timestamps param', function(assert) {
    assert.plan(3);
    var osrm = new OSRM(berlin_path);
    var options = {
        coordinates: [[52.542648,13.393252], [52.543079,13.394780], [52.542107,13.397389]],
        timestamps: "timestamps"
    };
    assert.throws(function() { osrm.match(options, function(err, response) {}) },
        "timestamps must be an array of integers (or undefined)");
    options.timestamps = ['invalid', 'timestamp', 'array'];
    assert.throws(function() { osrm.match(options, function(err, response) {}) },
        /timestamps array items must be numbers/);
    options.timestamps = [1424684612, 1424684616];
    assert.throws(function() { osrm.match(options, function(err, response) {}) },
        /timestamp array must have the same size as the coordinates array/);
});
