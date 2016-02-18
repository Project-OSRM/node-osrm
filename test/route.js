var OSRM = require('../');
var test = require('tape');
var berlin_path = "test/data/berlin-latest.osrm";

test('route: routes Berlin', function(assert) {
    assert.plan(2);
    var osrm = new OSRM(berlin_path);
    osrm.route({coordinates: [[52.519930,13.438640], [52.513191,13.415852]]}, function(err, route) {
        assert.ifError(err);
        assert.ok(route.route_summary);
    });
});

test('route: throws with too few or invalid args', function(assert) {
    assert.plan(2);
    var osrm = new OSRM(berlin_path);
    assert.throws(function() { osrm.route({coordinates: [[52.519930,13.438640], [52.513191,13.415852]]}) },
        /two arguments required/);
    assert.throws(function() { osrm.route(null, function(err, route) {}) },
        /first arg must be an object/);
});

test('route: throws with bad params', function(assert) {
    assert.plan(7);
    var osrm = new OSRM(berlin_path);
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
});

if (process.platform === 'darwin') {
  // shared memory does not work on Mac OS for now.
  test.skip('route: routes Berlin using shared memory', function(assert) {});
} else {
  test('route: routes Berlin using shared memory', function(assert) {
      assert.plan(2);
      var osrm = new OSRM();
      osrm.route({coordinates: [[52.519930,13.438640], [52.513191,13.415852]]}, function(err, route) {
          assert.ifError(err);
          assert.ok(route.route_summary);
      });
  });
}

test('route: routes Berlin with geometry compression', function(assert) {
    assert.plan(2);
    var osrm = new OSRM(berlin_path);
    var options = {
        coordinates: [[52.519930,13.438640], [52.513191,13.415852]],
    };
    osrm.route(options, function(err, route) {
        assert.ifError(err);
        assert.equal('string', typeof route.route_geometry);
    });
});

test('route: routes Berlin without geometry compression', function(assert) {
    assert.plan(3);
    var osrm = new OSRM(berlin_path);
    var options = {
        coordinates: [[52.519930,13.438640], [52.513191,13.415852]],
        compression: false
    };
    osrm.route(options, function(err, route) {
        assert.ifError(err);
        assert.ok(route.route_summary);
        assert.ok(Array.isArray(route.route_geometry));
    });
});

test('route: routes Berlin with options', function(assert) {
    assert.plan(5);
    var osrm = new OSRM(berlin_path);
    var options = {
        coordinates: [[52.519930,13.438640], [52.513191,13.415852]],
        zoomLevel: 17,
        alternateRoute: false,
        printInstructions: false,
        geometry: false
    };
    osrm.route(options, function(err, route) {
        assert.ifError(err);
        assert.ok(route.route_summary);
        assert.notOk(route.route_instructions);
        assert.notOk(route.alternative_geometries);
        assert.notOk(route.route_geometry);
    });
});

test('route: integer bearing values', function(assert) {
    assert.plan(2);
    var osrm = new OSRM(berlin_path);
    var options = {
        coordinates: [[52.519930,13.438640], [52.513191,13.415852]],
        bearings: [200, 250],
    };
    osrm.route(options, function(err, route) {
        assert.ifError(err);
        assert.ok(route.route_summary);
    });
});

test('route: array bearing values', function(assert) {
    assert.plan(2);
    var osrm = new OSRM(berlin_path);
    var options = {
        coordinates: [[52.519930,13.438640], [52.513191,13.415852]],
        bearings: [[200, 180], [250, 180]],
    };
    osrm.route(options, function(err, route) {
        assert.ifError(err);
        assert.ok(route.route_summary);
    });
});

test('route: invalid bearing values', function(assert) {
    assert.plan(2);
    var osrm = new OSRM(berlin_path);
    assert.throws(function() { osrm.route({
        coordinates: [[52.519930,13.438640], [52.513191,13.415852]],
        bearings: [[400, 180], [-250, 180]],
    }, function(err, route) {}) },
        /Bearing needs to be in range/);
    assert.throws(function() { osrm.route({
        coordinates: [[52.519930,13.438640], [52.513191,13.415852]],
        bearings: [[200], [250, 180]],
    }, function(err, route) {}) },
        /Bearing must be an array of/);
});

test('route: routes Berlin with hints', function(assert) {
    assert.plan(5);
    var osrm = new OSRM(berlin_path);
    var options = {
        coordinates: [[52.519930,13.438640], [52.513191,13.415852]],
        alternateRoute: false,
        printInstructions: false
    };
    osrm.route(options, function(err, first) {
        assert.ifError(err);
        assert.ok(first.route_summary);
        var checksum = first.hint_data.checksum;
        assert.equal("number", typeof(checksum));

        options.hints = first.hint_data.locations;
        options.checksum = checksum;

        osrm.route(options, function(err, second) {
            assert.ifError(err);
            assert.deepEqual(first, second);
        });
    });
});

test('route: routes Berlin with null hints', function(assert) {
    assert.plan(1);
    var osrm = new OSRM(berlin_path);
    var options = {
        coordinates: [[52.519930,13.438640], [52.513191,13.415852]],
        alternateRoute: false,
        printInstructions: false,
        hints: ['', '', '']
    };
    osrm.route(options, function(err, second) {
        assert.ifError(err);
    });
});
