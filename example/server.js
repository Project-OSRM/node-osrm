var express = require('express');
var osrm = require('../');

var app = express();
var use_shared_memory = true;
var opts = new osrm.Options('test/data/berlin.ini', use_shared_memory);
var engine = new osrm.Engine(opts);

// Accepts a query like:
// http://localhost:8888?start=52.519930,13.438640&end=52.513191,13.415852
app.get('/', function(req, res) {
    if (!req.query.start || !req.query.end) {
        return res.json({"error":"invalid start and end query"});
    }
    var coordinates = [];
    var start = req.query.start.split(',')
    coordinates.push([+start[0],+start[1]]);
    var end = req.query.end.split(',')
    coordinates.push([+end[0],+end[1]]);
    var query = new osrm.Query({
        coordinates: coordinates,
        alternateRoute: req.query.alternatives !== 'false'
    });
    engine.run(query, function(err, result) {
        if (err) return res.json({"error":err.message});
        try {
            return res.json(JSON.parse(result));
        } catch (err) {
            return res.send(result);
        }
    });
});

console.log('Listening on port: ' + 8888);
app.listen(8888);

