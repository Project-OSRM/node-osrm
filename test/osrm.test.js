var OSRM = require('../');
var assert = require('assert');

it('throws if new keyword is not used', function(done) {
    assert.throws(function() { OSRM(); },
      /Cannot call constructor as function, you need to use 'new' keyword/);
    done();
});

it('throws if necessary files do not exist', function(done) {
    assert.throws(function() { new OSRM("missing.osrm"); },
        /hsgr not found/);
    done();
});

it('throws if insufficient coordinates given', function() {
    var osrm = new OSRM("berlin-latest.osrm");
    assert.throws(function () { osrm.route({coordinates: []}, function(err) {}) });
});

it('routes Berlin', function(done) {
    var osrm = new OSRM("berlin-latest.osrm");
    osrm.route({coordinates: [[52.519930,13.438640], [52.513191,13.415852]]}, function(err, route) {
        assert.ifError(err);
        assert.equal(route.status_message, 'Found route between points');
        done();
    });
});

it.skip('routes Berlin using shared memory', function(done) {
    var osrm = new OSRM();
    osrm.route({coordinates: [[52.519930,13.438640], [52.513191,13.415852]]}, function(err, route) {
        assert.ifError(err);
        assert.equal(route.status_message, 'Found route between points');
        done();
    });
});

it('routes Berlin with options', function(done) {
    var osrm = new OSRM("berlin-latest.osrm");
    var options = {
        coordinates: [[52.519930,13.438640], [52.513191,13.415852]],
        zoomLevel: 17,
        alternateRoute: false,
        printInstructions: false
    };
    osrm.route(options, function(err, route) {
        assert.ifError(err);
        assert.equal(route.status_message,'Found route between points');
        assert.equal(undefined, route.route_instructions);
        assert.equal(undefined, route.alternative_geometries);
        done();
    });
});

it('distance table in Berlin', function(done) {
    var osrm = new OSRM("berlin-latest.osrm");
    var options = {
        coordinates: [[52.519930,13.438640], [52.513191,13.415852]]
    };
    osrm.table(options, function(err, table) {
        assert.ifError(err);
        assert(Array.isArray(table.distance_table), 'result must be an array');
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
        done();
    });
});

it('match in Berlin', function(done) {
    var osrm = new OSRM("berlin-latest.osrm");
    var options = {
        coordinates: [[52.542648,13.393252], [52.543079,13.394780], [52.542107,13.397389]],
        timestamps: [1424684612, 1424684616, 1424684620]
    };
    osrm.match(options, function(err, response) {
        assert.ifError(err);
        assert.equal(response.matchings.length, 1);
        done();
    });
});

it('match in Berlin without timestamps', function(done) {
    var osrm = new OSRM("berlin-latest.osrm");
    var options = {
        coordinates: [[52.542648,13.393252], [52.543079,13.394780], [52.542107,13.397389]]
    };
    osrm.match(options, function(err, response) {
        assert.ifError(err);
        assert.equal(response.matchings.length, 1);
        done();
    });
});

it('routes Berlin with hints', function(done) {
    var osrm = new OSRM("berlin-latest.osrm");
    var options = {
        coordinates: [[52.519930,13.438640], [52.513191,13.415852]],
        alternateRoute: false,
        printInstructions: false
    };
    osrm.route(options, function(err, first) {
        assert.ifError(err);
        assert.equal(first.status_message, 'Found route between points');
        var checksum = first.hint_data.checksum;
        assert.equal("number", typeof(checksum));

        options.hints = first.hint_data.locations;
        options.checksum = checksum;

        osrm.route(options, function(err, second) {
            assert.ifError(err);
            assert.deepEqual(first, second);
            done();
        });
    });
});

it('nearest', function(done) {
    var osrm = new OSRM("berlin-latest.osrm");
    osrm.nearest([52.4224, 13.333086], function(err, result) {
        assert.ifError(err);
        assert.equal(result.status, 0);
        assert.equal(result.mapped_coordinate.length, 2);
        assert(result.hasOwnProperty('name'));
        done();
    });
});

it('locate', function(done) {
    var osrm = new OSRM("berlin-latest.osrm");
    osrm.locate([52.4224, 13.333086], function(err, result) {
        assert.ifError(err);
        assert.equal(result.status, 0);
        assert.equal(result.mapped_coordinate.length, 2);
        done();
    });
});
