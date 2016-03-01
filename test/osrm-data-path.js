var path = require('path');

if (process.env.OSRM_DATA_PATH !== undefined) {
    exports.data_path = path.resolve(process.env.OSRM_DATA_PATH);
    console.log('Setting custom data path to ' + exports.data_path);
} else {
    exports.data_path = path.resolve("../../test/data/berlin-latest.osrm");    
}
