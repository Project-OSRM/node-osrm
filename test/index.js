var OSRM = require('../');
var test = require('tape');
var berlin_path = require('./osrm-data-path').data_path;

test('constructor: throws if new keyword is not used', function(assert) {
    assert.plan(1);
    assert.throws(function() { OSRM(); },
      /Cannot call constructor as function, you need to use 'new' keyword/);
});

if (process.platform === 'darwin') {
  // shared memory does not work on Mac OS for now.
  test.skip('constructor: uses defaults with no parameter', function(assert) {});
} else {
  test('constructor: uses defaults with no parameter', function(assert) {
      assert.plan(1);
      var osrm = new OSRM();
      assert.ok(osrm);
  });
}

test('constructor: does not accept more than one parameter', function(assert) {
    assert.plan(1);
    assert.throws(function() { new OSRM({}, {}); },
        /only accepts one parameter/);
});

test('constructor: throws if necessary files do not exist', function(assert) {
    assert.plan(1);
    assert.throws(function() { new OSRM("missing.osrm"); },
        /hsgr not found/);
});

test('constructor: takes a shared memory argument', function(assert) {
    assert.plan(1);
    var osrm = new OSRM({path: berlin_path, shared_memory: false});
    osrm.route({coordinates: [[52.519930,13.438640], [52.513191,13.415852]]}, function(err, route) {
        assert.ifError(err);
    });
});

test('constructor: throws if shared_memory==false with no path defined', function(assert) {
    assert.plan(1);
    assert.throws(function() { var osrm = new OSRM({shared_memory: false}); },
        /shared_memory must be enabled if no path is specified/);
});

test('constructor: throws if given a non-bool shared_memory option', function(assert) {
    assert.plan(1);
    assert.throws(function() { var osrm = new OSRM({path: berlin_path, shared_memory: "a"}); },
        /shared_memory option must be a boolean/);
});

test('constructor: throws if given a non-string/obj argument', function(assert) {
    assert.plan(1);
    assert.throws(function() { var osrm = new OSRM(true); },
        /parameter must be a path or options object/);
});

require('./route.js');
require('./trip.js');
require('./match.js');
require('./table.js');
require('./nearest.js');

