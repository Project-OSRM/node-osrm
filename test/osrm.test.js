var OSRM = require('../');
var assert = require('assert');

it('constructor: throws if new keyword is not used', function(done) {
    assert.throws(function() { OSRM(); },
      /Cannot call constructor as function, you need to use 'new' keyword/);
    done();
});

it('constructor: throws if necessary files do not exist', function(done) {
    assert.throws(function() { new OSRM("missing.osrm"); },
        /hsgr not found/);
    done();
});

it('constructor: takes a distance table length argument', function(done) {
    var osrm = new OSRM({path: "berlin-latest.osrm", distance_table: 30000});
    osrm.route({coordinates: [[52.519930,13.438640], [52.513191,13.415852]]}, function(err, route) {
        assert.ifError(err);
        done();
    });
});

it('constructor: takes a shared memory argument', function(done) {
    var osrm = new OSRM({path: "berlin-latest.osrm", shared_memory: false});
    osrm.route({coordinates: [[52.519930,13.438640], [52.513191,13.415852]]}, function(err, route) {
        assert.ifError(err);
        done();
    });
});

it('constructor: throws if shared_memory==false with no path defined', function() {
    assert.throws(function() { var osrm = new OSRM({shared_memory: false}); },
        /shared_memory must be enabled if no path is specified/);
});

it('constructor: throws if given a non-bool shared_memory option', function() {
    assert.throws(function() { var osrm = new OSRM({path: "berlin-latest.osrm", shared_memory: "a"}); },
        /shared_memory option must be a boolean/);
});

it('constructor: throws if given a non-uint distance_table option', function() {
    assert.throws(function() { var osrm = new OSRM({path: "berlin-latest.osrm", distance_table: -4}); },
        /the maximum number of locations in the distance table must be an unsigned integer/);
});

it('constructor: throws if given a non-string/obj argument', function() {
    assert.throws(function() { var osrm = new OSRM(true); },
        /first argument must be a path string or params object/);
});

it('route: routes Berlin', function(done) {
    var osrm = new OSRM("berlin-latest.osrm");
    osrm.route({coordinates: [[52.519930,13.438640], [52.513191,13.415852]]}, function(err, route) {
        assert.ifError(err);
        assert.equal(route.status_message, 'Found route between points');
        done();
    });
});

it('route: throws with too few or invalid args', function(done) {
    var osrm = new OSRM("berlin-latest.osrm");
    assert.throws(function() { osrm.route({coordinates: [[52.519930,13.438640], [52.513191,13.415852]]}) },
        /two arguments required/);
    assert.throws(function() { osrm.route(null, function(err, route) {}) },
        /first arg must be an object/);
    done();
});

it('route: throws with bad params', function(done) {
    var osrm = new OSRM("berlin-latest.osrm");
    assert.throws(function () { osrm.route({coordinates: []}, function(err) {}) });
    assert.throws(function() { osrm.route({}, function(err, route) {}) },
        /must provide a coordinates property/);
    assert.throws(function() { osrm.route({coordinates: null}, function(err, route) {}) },
        "coordinates must be an array of (lat/long) pairs");
    assert.throws(function() { osrm.route({coordinates: [52.519930, 13.438640]}, function(err, route) {}) },
        "coordinates must be an array of (lat/long) pairs");
    assert.throws(function() { osrm.route({coordinates: [[52.519930], [13.438640]]}, function(err, route) {}) },
        "coordinates must be an array of (lat/long) pairs");
    assert.throws(function() { osrm.route({coordinates: [[52.519930,13.438640], [52.513191,13.415852]], hints: null}, function(err, route) {}) },
        "hints must be an array of strings/null");
    var options = {
        coordinates: [[52.519930,13.438640], [52.513191,13.415852]],
        alternateRoute: false,
        printInstructions: false,
        hints: [[52.519930,13.438640]]
    };
    assert.throws(function() { osrm.route(options, function(err, route) {}) },
        /hint must be null or string/);
    done();
});

it('route: takes jsonp parameter', function(done) {
    var osrm = new OSRM("berlin-latest.osrm");
    osrm.route({coordinates: [[52.519930,13.438640], [52.513191,13.415852]], jsonpParameter: 'function'}, function(err, route) {
        assert.ifError(err);
        assert.equal(route.status_message, 'Found route between points');
        done();
    });
});

if (process.platform === 'darwin') {
  // shared memory does not work on Mac OS for now.
  it.skip('route: routes Berlin using shared memory', function(done) {});
} else {
  it('route: routes Berlin using shared memory', function(done) {
      var osrm = new OSRM();
      osrm.route({coordinates: [[52.519930,13.438640], [52.513191,13.415852]]}, function(err, route) {
          assert.ifError(err);
          assert.equal(route.status_message, 'Found route between points');
          done();
      });
  });
}

it('route: routes Berlin with options', function(done) {
    var osrm = new OSRM("berlin-latest.osrm");
    var options = {
        coordinates: [[52.519930,13.438640], [52.513191,13.415852]],
        zoomLevel: 17,
        alternateRoute: false,
        printInstructions: false,
        geometry: false
    };
    osrm.route(options, function(err, route) {
        assert.ifError(err);
        assert.equal(route.status_message,'Found route between points');
        assert.equal(undefined, route.route_instructions);
        assert.equal(undefined, route.alternative_geometries);
        assert.equal(undefined, route.route_geometry);
        done();
    });
});

it('route: routes Berlin with hints', function(done) {
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

it('route: routes Berlin with null hints', function(done) {
    var osrm = new OSRM("berlin-latest.osrm");
    var options = {
        coordinates: [[52.519930,13.438640], [52.513191,13.415852]],
        alternateRoute: false,
        printInstructions: false,
        hints: ['', '', '']
    };
    osrm.route(options, function(err, second) {
        assert.ifError(err);
        done();
    });
});

it('table: distance table in Berlin', function(done) {
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

it('table: throws on invalid arguments', function(done) {
    var osrm = new OSRM("berlin-latest.osrm");
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
    done();
});

it('table: throws on invalid arguments', function(done) {
    var osrm = new OSRM("berlin-latest.osrm");
    assert.throws(function() { osrm.table(null, function() {}); },
        /first arg must be an object/);
    done();
});

it('match: match in Berlin', function(done) {
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

it('match: match in Berlin without timestamps', function(done) {
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

it('match: match in Berlin with all options', function(done) {
    var osrm = new OSRM("berlin-latest.osrm");
    var options = {
        coordinates: [[52.542648,13.393252], [52.543079,13.394780], [52.542107,13.397389]],
        timestamps: [1424684612, 1424684616, 1424684620],
        classify: true,
        gps_precision: 4.07,
        matching_beta: 10.0,
    };
    osrm.match(options, function(err, response) {
        assert.ifError(err);
        assert.equal(response.matchings.length, 1);
        assert.equal(response.matchings[0].confidence > 0, true);
        done();
    });
});

it('match: throws on missing arguments', function(done) {
    var osrm = new OSRM("berlin-latest.osrm");
    assert.throws(function() { osrm.match({}) },
        /two arguments required/);
    done();
});

it('match: throws on non-object arg', function(done) {
    var osrm = new OSRM("berlin-latest.osrm");
    assert.throws(function() { osrm.match(null, function(err, response) {}) },
        /first arg must be an object/);
    done();
});

it('match: throws on invalid coordinates param', function(done) {
    var osrm = new OSRM("berlin-latest.osrm");
    var options = {
        coordinates: ''
    }
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
    done();
});

it('match: throws on invalid timestamps param', function(done) {
    var osrm = new OSRM("berlin-latest.osrm");
    var options = {
        coordinates: [[52.542648,13.393252], [52.543079,13.394780], [52.542107,13.397389]],
        timestamps: "timestamps"
    }
    assert.throws(function() { osrm.match(options, function(err, response) {}) },
        "timestamps must be an array of integers (or undefined)");
    options.timestamps = ['invalid', 'timestamp', 'array'];
    assert.throws(function() { osrm.match(options, function(err, response) {}) },
        /timestamps array items must be numbers/);
    options.timestamps = [1424684612, 1424684616];
    assert.throws(function() { osrm.match(options, function(err, response) {}) },
        /timestamp array must have the same size as the coordinates array/);
    done();
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

it('nearest: throws on invalid args', function(done) {
    var osrm = new OSRM("berlin-latest.osrm");
    var options = {};
    assert.throws(function() { osrm.nearest(options); },
        /two arguments required/);
    assert.throws(function() { osrm.nearest(null, function(err, res) {}); },
        /first argument must be an array of lat, long/);
    options.coordinates = [52.4224];
    assert.throws(function() { osrm.nearest(options, function(err, res) {}); },
        /first argument must be an array of lat, long/);
    done();
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

it('locate: throws on incorrect number of args', function(done) {
    var osrm = new OSRM("berlin-latest.osrm");
    assert.throws(function() { osrm.locate([52.4224, 13.333086]) },
        /two arguments required/);
    done();
});

it('locate: throws on invalid coordinate arg', function(done) {
    var osrm = new OSRM("berlin-latest.osrm");
    assert.throws(function() { osrm.locate(52.4224, function(err, result) {}) },
        /first argument must be an array of lat, long/);
    assert.throws(function() { osrm.locate([52.4224], function(err, result) {}) },
        /first argument must be an array of lat, long/);
    done();
});
