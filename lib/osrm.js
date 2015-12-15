var exists = require('fs').existsSync || require('path').existsSync;
var path = require('path');

var OSRM = module.exports = require('../build/Release/osrm.node').OSRM;
OSRM.version = require('../package.json').version;
