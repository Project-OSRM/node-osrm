var OSRM = require('../');
var test = require('tape');
var berlin_path = "test/data/berlin-latest.osrm";

test('route: routes Berlin', function(assert) {
    assert.plan(5);
    var osrm = new OSRM(berlin_path);
    osrm.route({coordinates: [[52.519930,13.438640], [52.513191,13.415852]]}, function(err, route) {
        assert.ifError(err);
        assert.ok(route.waypoints);
        assert.ok(route.routes);
        assert.ok(route.routes.length);
        assert.ok(route.routes[0].geometry);
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
        'coordinates must be an array of (lat/long) pairs');
    assert.throws(function() { osrm.route({coordinates: [52.519930, 13.438640]}, function(err, route) {}) },
        'coordinates must be an array of (lat/long) pairs');
    assert.throws(function() { osrm.route({coordinates: [[52.519930], [13.438640]]}, function(err, route) {}) },
        'coordinates must be an array of (lat/long) pairs');
    assert.throws(function() { osrm.route({coordinates: [[52.519930,13.438640], [52.513191,13.415852]], hints: null}, function(err, route) {}) },
        'hints must be an array of strings/null');
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
          assert.ok(Array.isArray(route.routes));
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
        assert.equal('string', typeof route.routes[0].geometry);
    });
});

test('route: routes Berlin without geometry compression', function(assert) {
    assert.plan(4);
    var osrm = new OSRM(berlin_path);
    var options = {
        coordinates: [[52.519930,13.438640], [52.513191,13.415852]],
        geometries: 'geojson'
    };
    osrm.route(options, function(err, route) {
        assert.ifError(err);
        assert.ok(Array.isArray(route.routes));
        assert.ok(Array.isArray(route.routes[0].geometry.coordinates));
        assert.equal(route.routes[0].geometry.type, 'LineString');
    });
});

test('route: routes Berlin with options', function(assert) {
    assert.plan(8);
    var osrm = new OSRM(berlin_path);
    var options = {
        coordinates: [[52.519930,13.438640], [52.513191,13.415852]],
        alternative: false,
        steps: false,
        uturns: [true, false],
        overview: 'false',
        geometries: 'polyline'
    };
    osrm.route(options, function(err, first) {
        assert.ifError(err);
        assert.ok(first.routes);
        assert.ok(first.routes[0].legs.every(function(l) { return Array.isArray(l.steps) && !l.steps.length; }));
        assert.equal(first.routes.length, 1);
        assert.notOk(first.routes[0].geometry);

        options.overview = 'full';
        osrm.route(options, function(err, full) {
            assert.ifError(err);
            options.overview = 'simplified';
            osrm.route(options, function(err, simplified) {
                assert.ifError(err);
                assert.notEqual(full.routes[0].geometry, simplified.routes[0].geometry);
            });
        });
    });

});

test('route: invalid route options', function(assert) {
    assert.plan(8);
    var osrm = new OSRM(berlin_path);
    assert.throws(function() { osrm.route({
        coordinates: [[52.519930,13.438640], [52.513191,13.415852]],
        uturns: true
    }, function(err, route) {}); },
        'uturns must be an array of booleans');
    assert.throws(function() { osrm.route({
        coordinates: [[52.519930,13.438640], [52.513191,13.415852]],
        uturns: [1, 3]
    }, function(err, route) {}); },
        'uturn must be boolean');
    assert.throws(function() { osrm.route({
        coordinates: [[52.519930,13.438640], [52.513191,13.415852]],
        uturns: true
    }, function(err, route) {}); },
        'uturns must be an array of booleans');
    assert.throws(function() { osrm.route({
        coordinates: [[52.519930,13.438640], [52.513191,13.415852]],
        geometries: true
    }, function(err, route) {}); },
        'geometries must be a string: [polyline, geojson]');
    assert.throws(function() { osrm.route({
        coordinates: [[52.519930,13.438640], [52.513191,13.415852]],
        uturns: true
    }, function(err, route) {}); },
        'uturns must be an array of booleans');
    assert.throws(function() { osrm.route({
        coordinates: [[52.519930,13.438640], [52.513191,13.415852]],
        overview: false
    }, function(err, route) {}); },
        'overview must be a string: [simplified, full, false]');
    assert.throws(function() { osrm.route({
        coordinates: [[52.519930,13.438640], [52.513191,13.415852]],
        overview: false
    }, function(err, route) {}); },
        'overview must be a string: [simplified, full, false]');
    assert.throws(function() { osrm.route({
        coordinates: [[52.519930,13.438640], [52.513191,13.415852]],
        overview: 'maybe'
    }, function(err, route) {}); },
        '\'overview\' param must be one of [simplified, full, false]');
});

test('route: integer bearing values no longer supported', function(assert) {
    assert.plan(1);
    var osrm = new OSRM(berlin_path);
    var options = {
        coordinates: [[52.519930,13.438640], [52.513191,13.415852]],
        bearings: [200, 250],
    };
    assert.throws(function() { osrm.route(options, function(err, route) {}); },
        'Bearing must be an array of [bearing, range] or null');
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
        assert.ok(route.routes[0]);
    });
});

test('route: invalid bearing values', function(assert) {
    assert.plan(3);
    var osrm = new OSRM(berlin_path);
    assert.throws(function() { osrm.route({
        coordinates: [[52.519930,13.438640], [52.513191,13.415852]],
        bearings: [[400, 180], [-250, 180]],
    }, function(err, route) {}) },
        /Bearing values need to be in range 0..360/);
    assert.throws(function() { osrm.route({
        coordinates: [[52.519930,13.438640], [52.513191,13.415852]],
        bearings: [[200], [250, 180]],
    }, function(err, route) {}) },
        /Bearing must be an array of/);
    assert.throws(function() { osrm.route({
        coordinates: [[52.519930,13.438640], [52.513191,13.415852]],
        bearings: [[400, 109], [100, 720]],
    }, function(err, route) {}) },
        'Bearing values need to be numbers in range 0..360');
});

test('route: routes Berlin with hints', function(assert) {
    assert.plan(5);
    var osrm = new OSRM(berlin_path);
    var options = {
        coordinates: [[52.519930,13.438640], [52.513191,13.415852]],
        alternative: false,
        steps: false
    };
    osrm.route(options, function(err, first) {
        assert.ifError(err);
        assert.ok(first.waypoints);
        var hints = first.waypoints.map(function(wp) { return wp.hint; });
        assert.ok(hints.every(function(h) { return typeof h === 'string'; }));

        options.hints = hints;

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
        alternative: false,
        steps: false,
        hints: [null, null]
    };
    osrm.route(options, function(err, route) {
        assert.ifError(err);
    });
});

test('route: throws on bad hints', function(assert) {
    assert.plan(1);
    var osrm = new OSRM(berlin_path);
    assert.throws(function() { osrm.route({
        coordinates: [[52.519930,13.438640], [52.513191,13.415852]],
        hints: ['', '']
    })}, 'hint cannot be an empty string');
});

test('route: routes Berlin with valid radius values', function(assert) {
    assert.plan(3);
    var osrm = new OSRM(berlin_path);
    var options = {
        coordinates: [[52.519930,13.438640], [52.513191,13.415852]],
        alternative: false,
        steps: false,
        radiuses: [10, 10]
    };
    osrm.route(options, function(err, route) {
        assert.ifError(err);
    });
    options.radiuses = [null, null];
    osrm.route(options, function(err, route) {
        assert.ifError(err);
    });
    options.radiuses = [100];
    osrm.route(options, function(err, route) {
        assert.ifError(err);
    });
});

test('route: throws on bad radiuses', function(assert) {
    assert.plan(2);
    var osrm = new OSRM(berlin_path);
    var options = {
        coordinates: [[52.519930,13.438640], [52.513191,13.415852]],
        alternative: false,
        steps: false,
        radiuses: [10, 10]
    };
    assert.throws(function() { osrm.route({
        coordinates: [[52.519930,13.438640], [52.513191,13.415852]],
        radiuses: 10
    }, function(err, route) {}) },
        'radiuses must be an array of non-negative doubles or null');
    assert.throws(function() { osrm.route({
        coordinates: [[52.519930,13.438640], [52.513191,13.415852]],
        radiuses: ['magic', 'numbers']
    }, function(err, route) {}) },
        'radiuses must be an array of non-negative doubles or null');
});
