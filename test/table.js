var OSRM = require('../');
var test = require('tape');
var berlin_path = require('./osrm-data-path').data_path;

test('table: distance table in Berlin', function(assert) {
    assert.plan(9);
    var osrm = new OSRM(berlin_path);
    var options = {
        coordinates: [[52.519930,13.438640], [52.513191,13.415852]]
    };
    osrm.table(options, function(err, table) {
        assert.ifError(err);
        assert.ok(Array.isArray(table.distance_table), 'result must be an array');
        var row_count = table.distance_table.length;
        for (var i = 0; i < row_count; ++i) {
            var column = table.distance_table[i];
            var column_count = column.length;
            assert.equal(row_count, column_count);
            for (var j = 0; j < column_count; ++j) {
                if (i == j) {
                    // check that diagonal is zero
                    assert.equal(0, column[j], "diagonal must be zero");
                } else {
                    // everything else is non-zero
                    assert.notEqual(0, column[j], "other entries must be non-zero");
                }
            }
        }
        assert.equal(options.coordinates.length, row_count);
    });
});

test('table: distance table in Berlin with sources/destinations', function(assert) {
    assert.plan(6);
    var osrm = new OSRM(berlin_path);
    var options = {
        sources: [[52.519930,13.438640]],
        destinations: [[52.519930,13.438640], [52.513191,13.415852]]
    };
    osrm.table(options, function(err, table) {
        assert.ifError(err);
        assert.ok(Array.isArray(table.distance_table), 'result must be an array');
        var row_count = table.distance_table.length;
        for (var i = 0; i < row_count; ++i) {
            var column = table.distance_table[i];
            var column_count = column.length;
            assert.equal(options.destinations.length, column_count);
            for (var j = 0; j < column_count; ++j) {
                if (i == j) {
                    // check that diagonal is zero
                    assert.equal(0, column[j], "diagonal must be zero");
                } else {
                    // everything else is non-zero
                    assert.notEqual(0, column[j], "other entries must be non-zero");
                }
            }
        }
        assert.equal(options.sources.length, row_count);
    });
});

test('table: throws on invalid arguments', function(assert) {
    assert.plan(7);
    var osrm = new OSRM(berlin_path);
    var options = {};
    assert.throws(function() { osrm.table(options); },
        /two arguments required/);
    options.coordinates = null;
    assert.throws(function() { osrm.table(options, function() {}); },
        "coordinates must be an array of (lat/long) pairs");
    options.coordinates = [[52.542648,13.393252]];
    assert.throws(function() { osrm.table(options, function(err, response) {}) },
        /at least two coordinates must be provided/);
    options.coordinates = [52.542648,13.393252];
    assert.throws(function() { osrm.table(options, function(err, response) {}) },
        "coordinates must be an array of (lat/long) pairs");
    options.coordinates = [[52.542648],[13.393252]];
    assert.throws(function() { osrm.table(options, function(err, response) {}) },
        "coordinates must be an array of (lat/long) pairs");
    options.coordinates = [[52.542648,13.393252], [52.542648,13.393252]];
    options.sources = [[52.542648,13.393252], [52.542648,13.393252]];
    assert.throws(function() { osrm.table(options, function(err, response) {}) },
        /Both sources and destinations need to be specified/);
    options.destinations = [[52.542648,13.393252], [52.542648,13.393252]];
    assert.throws(function() { osrm.table(options, function(err, response) {}) },
        /You can either specify sources and destinations, or coordinates/);
});

test('table: throws on invalid arguments', function(assert) {
    assert.plan(1);
    var osrm = new OSRM(berlin_path);
    assert.throws(function() { osrm.table(null, function() {}); },
        /first arg must be an object/);
});

