var osrm = require('osrm');
var assert = require('assert');

describe('osrm', function() {
    it('should be initialized', function(done) {
        var engine = new osrm.Engine("../server.ini");
        var query = new osrm.Query( { start: [ 47.68757916850813,-122.38494873046875 ],
                                      end:   [ 47.674635091761616, -122.2943115234375 ]
                                    });
        var sync_result = engine.run(query);
        engine.run(query,function(err,async_result) {
            assert.equal(sync_result,async_result);
            var result_json = JSON.parse(async_result);
            assert.equal(result_json.status_message,'Found route between points');
            done();
        });
    });
});