var OSRM = module.exports = require('./binding/osrm.node').OSRM;

OSRM.version = require('../package.json').version;

(function() {
    function parsed(original) {
        return function (options, callback) {
            original.call(this, options, function (err, result) {
                if (err) return callback(err);
                try {
                    callback(err, JSON.parse(result));
                } catch (e) {
                    callback(e);
                }
            });
        };
    }

    ['route', 'nearest', 'locate'].forEach(function (fn) {
        OSRM.prototype[fn] = parsed(OSRM.prototype[fn]);
    });

    var table = parsed(OSRM.prototype.table);
    OSRM.prototype.table = function (options, callback) {
        table.call(this, options, function (err, result) {
            return callback(err, result && result.distance_table);
        });
    };
})();
