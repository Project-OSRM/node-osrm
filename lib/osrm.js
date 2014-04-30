var OSRM = module.exports = require('./binding/osrm.node');

OSRM.version = require('../package.json').version;

['route', 'nearest', 'locate'].forEach(function (fn) {
    var original = OSRM.prototype[fn];
    OSRM.prototype[fn] = function (options, callback) {
        original.call(this, options, function (err, result) {
            if (err) return callback(err);
            try {
                callback(err, JSON.parse(result));
            } catch (e) {
                callback(e);
            }
        });
    }
});
