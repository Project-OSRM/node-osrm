var OSRM = require('../');
var assert = require('assert');

///////////////////////////// CONSTRUCTOR TESTS ////////////////////////////////

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

/////////////////////////////// ROUTE TESTS ////////////////////////////////////

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

/*
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
*/

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


/////////////////////////////// TRIP TESTS ////////////////////////////////////

it('trip: trip in Berlin', function(done) {
    var osrm = new OSRM("berlin-latest.osrm");
    osrm.trip({coordinates: [[52.519930,13.438640], [52.513191,13.415852]]}, function(err, trip) {
        assert.ifError(err);
        for (t = 0; t < trip.trips.length; t++) {
            assert.equal(trip.trips[t].status_message, 'Found route between points');
        }
        done();
    });
});

it('trip: trip with many locations in Berlin', function(done) {
    var osrm = new OSRM("berlin-latest.osrm");
    osrm.trip({coordinates: [[52.51663871100423,13.36761474609375],[52.506191342034576,13.374481201171875],[52.50535544522142,13.404693603515625],[52.50159371284434,13.388900756835938],[52.518727886767266,13.386840820312498],[52.528754547664185,13.4088134765625],[52.51705655410405,13.41156005859375],[52.512042174642346,13.420486450195312],[52.50368360390624,13.413619995117188],[52.504101570196205,13.36212158203125],[52.52248815280757,13.35113525390625],[52.53460237630516,13.36761474609375],[52.53710835019913,13.383407592773438],[52.536690697815736,13.392333984375],[52.532931647583325,13.42529296875],[52.52415927884915,13.399200439453125],[52.51956352925745,13.390960693359375],[52.533349335723294,13.375167846679688],[52.520399155853454,13.37860107421875],[52.52081696319122,13.355255126953125],[52.5143405029259,13.385467529296875],[52.513086884218325,13.398857116699219],[52.50744515744915,13.399200439453125],[52.49783165855699,13.409500122070312],[52.500339730516934,13.424949645996094],[52.50786308797268,13.440055847167969],[52.511624283857785,13.428382873535156],[52.50451953251202,13.437652587890625],[52.5199813445422,13.443145751953125],[52.52520370034151,13.431129455566406],[52.52896341209634,13.418426513671875],[52.517474393230245,13.429069519042969],[52.528127948407935,13.418083190917969],[52.52833681581998,13.405036926269531],[52.53084314728766,13.384437561035156],[52.53084314728766,13.374481201171875],[52.532305107923925,13.3978271484375],[52.526039219655445,13.418769836425781],[52.51642978796417,13.441085815429688],[52.51601193890388,13.448638916015625],[52.50535544522142,13.44623565673828],[52.502638670794546,13.430442810058594],[52.520190250694526,13.358688354492188],[52.531887409851336,13.358001708984375],[52.528545682238736,13.367271423339842],[52.52958999943304,13.387870788574219],[52.53961418106945,13.406410217285156],[52.50556442091497,13.399543762207031],[52.50389258754797,13.374824523925781],[52.51099744023003,13.386154174804688],[52.49657756892365,13.40229034423828]]}, function(err, trip) {
        assert.ifError(err);
        for (t = 0; t < trip.trips.length; t++) {
            assert.equal(trip.trips[t].status_message, 'Found route between points');
        }
        done();
    });
});

it('trip: throws with too few or invalid args', function(done) {
    var osrm = new OSRM("berlin-latest.osrm");
    assert.throws(function() { osrm.trip({coordinates: [[52.519930,13.438640], [52.513191,13.415852]]}) },
        /two arguments required/);
    assert.throws(function() { osrm.trip(null, function(err, trip) {}) },
        /first arg must be an object/);
    done();
});

it('trip: throws with bad params', function(done) {
    var osrm = new OSRM("berlin-latest.osrm");
    assert.throws(function () { osrm.trip({coordinates: []}, function(err) {}) });
    assert.throws(function() { osrm.trip({}, function(err, trip) {}) },
        /must provide a coordinates property/);
    assert.throws(function() { osrm.trip({coordinates: null}, function(err, trip) {}) },
        "coordinates must be an array of (lat/long) pairs");
    assert.throws(function() { osrm.trip({coordinates: [52.519930, 13.438640]}, function(err, trip) {}) },
        "coordinates must be an array of (lat/long) pairs");
    assert.throws(function() { osrm.trip({coordinates: [[52.519930], [13.438640]]}, function(err, trip) {}) },
        "coordinates must be an array of (lat/long) pairs");
    assert.throws(function() { osrm.trip({coordinates: [[52.519930,13.438640], [52.513191,13.415852]], hints: null}, function(err, trip) {}) },
        "hints must be an array of strings/null");
    var options = {
        coordinates: [[52.519930,13.438640], [52.513191,13.415852]],
        alternateroute: false,
        printInstructions: false,
        hints: [[52.519930,13.438640]]
    };
    assert.throws(function() { osrm.trip(options, function(err, trip) {}) },
        /hint must be null or string/);
    done();
});

it('trip: takes jsonp parameter', function(done) {
    var osrm = new OSRM("berlin-latest.osrm");
    osrm.trip({coordinates: [[52.519930,13.438640], [52.513191,13.415852]], jsonpParameter: 'function'}, function(err, trip) {
        assert.ifError(err);
        for (t = 0; t < trip.trips.length; t++) {
            assert.equal(trip.trips[t].status_message, 'Found route between points');
        }
        done();
    });
});

/*
if (process.platform === 'darwin') {
  // shared memory does not work on Mac OS for now.
  it.skip('trip: routes Berlin using shared memory', function(done) {});
} else {
  it('trip: routes Berlin using shared memory', function(done) {
      var osrm = new OSRM();
      osrm.trip({coordinates: [[52.519930,13.438640], [52.513191,13.415852]]}, function(err, trip) {
          assert.ifError(err);
          for (t = 0; t < trip.trips.length; t++) {
            assert.equal(trip.trips[t].status_message, 'Found route between points');
          }
          done();
      });
  });
}
*/

it('trip: routes Berlin with hints', function(done) {
    var osrm = new OSRM("berlin-latest.osrm");
    var options = {
        coordinates: [[52.519930,13.438640], [52.513191,13.415852]],
        alternateroute: false,
        printInstructions: false
    };
    osrm.trip(options, function(err, first) {
        assert.ifError(err);
        for (t = 0; t < first.trips.length; t++) {
            assert.equal(first.trips[t].status_message, 'Found route between points');
            var checksum = first.trips[t].hint_data.checksum;
            options.checksum = checksum;
            assert.equal("number", typeof(checksum));

            options.hints = [];
            options.hints.length = options.coordinates.length;

            for (p = 0; p < first.trips[t].permutation.length; p++) {
                options.hints[first.trips[t].permutation[p]] = first.trips[t].hint_data.locations[p];
            }
        }

        osrm.trip(options, function(err, second) {
            assert.ifError(err);
            assert.deepEqual(first, second);
            done();
        });
    });
});

it('trip: trip through Berlin with options', function(done) {
    var osrm = new OSRM("berlin-latest.osrm");
    var options = {
        coordinates: [[52.519930,13.438640], [52.513191,13.415852]],
        zoomLevel: 17,
        alternateroute: false,
        printInstructions: false,
        geometry: false
    };
    osrm.trip(options, function(err, trip) {
        assert.ifError(err);
        for (t = 0; t < trip.trips.length; t++) {
            assert.equal(trip.trips[t].status_message, 'Found route between points');
            assert.equal(undefined, trip.trips[t].route_instructions);
            assert.equal(undefined, trip.trips[t].alternative_geometries);
            assert.equal(undefined, trip.trips[t].route_geometry);
        }
        done();
    });
});

it('trip: routes Berlin with null hints', function(done) {
    var osrm = new OSRM("berlin-latest.osrm");
    var options = {
        coordinates: [[52.519930,13.438640], [52.513191,13.415852]],
        alternateRoute: false,
        printInstructions: false,
        hints: ['', '', '']
    };
    osrm.trip(options, function(err, second) {
        assert.ifError(err);
        done();
    });
});

/////////////////////////////// TABLE TESTS ////////////////////////////////////

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

/////////////////////////////// MATCH TESTS ////////////////////////////////////

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

////////////////////////////// NEAREST TESTS ///////////////////////////////////

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

////////////////////////////// LOCATE TESTS ////////////////////////////////////

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
