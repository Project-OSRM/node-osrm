var OSRM = require('../');
var test = require('tape');
var berlin_path = require('./osrm-data-path').data_path;

test('trip: trip in Berlin', function(assert) {
    assert.plan(2);
    var osrm = new OSRM(berlin_path);
    osrm.trip({coordinates: [[52.51663871100423,13.36761474609375],[52.506191342034576,13.374481201171875]]}, function(err, trip) {
        assert.ifError(err);
        for (t = 0; t < trip.trips.length; t++) {
            assert.ok(trip.trips[t].route_summary);
        }
    });
});

test('trip: trip with many locations in Berlin', function(assert) {
    assert.plan(3);
    var osrm = new OSRM(berlin_path);
    osrm.trip({coordinates: [[52.51663871100423,13.36761474609375],[52.506191342034576,13.374481201171875],[52.50535544522142,13.404693603515625],[52.50159371284434,13.388900756835938],[52.518727886767266,13.386840820312498],[52.528754547664185,13.4088134765625],[52.51705655410405,13.41156005859375],[52.512042174642346,13.420486450195312],[52.50368360390624,13.413619995117188],[52.504101570196205,13.36212158203125],[52.52248815280757,13.35113525390625],[52.53460237630516,13.36761474609375],[52.53710835019913,13.383407592773438],[52.536690697815736,13.392333984375],[52.532931647583325,13.42529296875],[52.52415927884915,13.399200439453125],[52.51956352925745,13.390960693359375],[52.533349335723294,13.375167846679688],[52.520399155853454,13.37860107421875],[52.52081696319122,13.355255126953125],[52.5143405029259,13.385467529296875],[52.513086884218325,13.398857116699219],[52.50744515744915,13.399200439453125],[52.49783165855699,13.409500122070312],[52.500339730516934,13.424949645996094],[52.50786308797268,13.440055847167969],[52.511624283857785,13.428382873535156],[52.50451953251202,13.437652587890625],[52.5199813445422,13.443145751953125],[52.52520370034151,13.431129455566406],[52.52896341209634,13.418426513671875],[52.517474393230245,13.429069519042969],[52.528127948407935,13.418083190917969],[52.52833681581998,13.405036926269531],[52.53084314728766,13.384437561035156],[52.53084314728766,13.374481201171875],[52.532305107923925,13.3978271484375],[52.526039219655445,13.418769836425781],[52.51642978796417,13.441085815429688],[52.51601193890388,13.448638916015625],[52.50535544522142,13.44623565673828],[52.502638670794546,13.430442810058594],[52.520190250694526,13.358688354492188],[52.531887409851336,13.358001708984375],[52.528545682238736,13.367271423339842],[52.52958999943304,13.387870788574219],[52.53961418106945,13.406410217285156],[52.50556442091497,13.399543762207031],[52.50389258754797,13.374824523925781],[52.51099744023003,13.386154174804688],[52.49657756892365,13.40229034423828]]}, function(err, trip) {
        assert.ifError(err);
        for (t = 0; t < trip.trips.length; t++) {
            assert.ok(trip.trips[t].route_summary);
        }
    });
});

test('trip: throws with too few or invalid args', function(assert) {
    assert.plan(2);
    var osrm = new OSRM(berlin_path);
    assert.throws(function() { osrm.trip({coordinates: [[52.519930,13.438640], [52.513191,13.415852]]}) },
        /two arguments required/);
    assert.throws(function() { osrm.trip(null, function(err, trip) {}) },
        /first arg must be an object/);
});

test('trip: throws with bad params', function(assert) {
    assert.plan(7);
    var osrm = new OSRM(berlin_path);
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
        printInstructions: false,
        hints: [[52.519930,13.438640]]
    };
    assert.throws(function() { osrm.trip(options, function(err, trip) {}) },
        /hint must be null or string/);
});

if (process.platform === 'darwin') {
  // shared memory does not work on Mac OS for now.
  test.skip('trip: routes Berlin using shared memory', function(assert) {});
} else {
  test('trip: routes Berlin using shared memory', function(assert) {
      assert.plan(2);
      var osrm = new OSRM();
      osrm.trip({coordinates: [[52.519930,13.438640], [52.513191,13.415852]]}, function(err, trip) {
          assert.ifError(err);
          for (t = 0; t < trip.trips.length; t++) {
            assert.ok(trip.trips[t].route_summary);
          }
      });
  });
}

test('trip: routes Berlin with hints', function(assert) {
    assert.plan(5);
    var osrm = new OSRM(berlin_path);
    var options = {
        coordinates: [[52.519930,13.438640], [52.513191,13.415852]],
        printInstructions: false
    };
    osrm.trip(options, function(err, first) {
        assert.ifError(err);
        for (t = 0; t < first.trips.length; t++) {
            assert.ok(first.trips[t].route_summary);
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
        });
    });
});

test('trip: trip through Berlin with geometry compression', function(assert) {
    assert.plan(2);
    var osrm = new OSRM(berlin_path);
    var options = {
        coordinates: [[52.519930,13.438640], [52.513191,13.415852]]
    };
    osrm.trip(options, function(err, trip) {
        assert.ifError(err);
        for (t = 0; t < trip.trips.length; t++) {
            assert.equal('string', typeof trip.trips[t].route_geometry);
        }
    });
});

test('trip: trip through Berlin without geometry compression', function(assert) {
    assert.plan(2);
    var osrm = new OSRM(berlin_path);
    var options = {
        coordinates: [[52.519930,13.438640], [52.513191,13.415852]],
        compression: false
    };
    osrm.trip(options, function(err, trip) {
        assert.ifError(err);
        for (t = 0; t < trip.trips.length; t++) {
            assert.ok(Array.isArray(trip.trips[t].route_geometry), "Geometry is Array");
        }
    });
});

test('trip: trip through Berlin with options', function(assert) {
    assert.plan(5);
    var osrm = new OSRM(berlin_path);
    var options = {
        coordinates: [[52.519930,13.438640], [52.513191,13.415852]],
        zoomLevel: 17,
        printInstructions: false,
        geometry: false
    };
    osrm.trip(options, function(err, trip) {
        assert.ifError(err);
        for (t = 0; t < trip.trips.length; t++) {
            assert.ok(trip.trips[t]);
            assert.notOk(trip.trips[t].route_instructions);
            assert.notOk(trip.trips[t].alternative_geometries);
            assert.notOk(trip.trips[t].route_geometry);
        }
    });
});

test('trip: routes Berlin with null hints', function(assert) {
    assert.plan(1);
    var osrm = new OSRM(berlin_path);
    var options = {
        coordinates: [[52.519930,13.438640], [52.513191,13.415852]],
        printInstructions: false,
        hints: ['', '', '']
    };
    osrm.trip(options, function(err, second) {
        assert.ifError(err);
    });
});

