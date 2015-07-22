## `osrm.locate`

Returns coordinate snapped to nearest node

### Parameters

* `Point` **`Array<Number>`** latitude, longitude pair to locate on the network.


### Examples

```js
var osrm = new OSRM("berlin-latest.osrm");
osrm.locate([52.4224, 13.333086], function(err, result) {
    if(err) throw err;
});
```

Returns  Location of the node as latitude longitude pair.

## `osrm.match`

Matches given coordinates to the road network

### Parameters

* `coordinates` **`Array<Number>`** the point to match as a latitude, longitude array.
* `timestamps` **`Array<Number>`** an array of the preceding point in UNIX style format (eg: 1424684612).
* `geometry` **`[Boolean]`** Return route geometry. (optional, default `true`)
* `classify` **`[Boolean]`** Return a confidence value for this matching. (optional, default `false`)
* `gps_precision` **`[Number]`** Specify gps precision as standart deviation in meters. (optional, default `-1`)
* `matching_beta` **`[Number]`** Specify beta value for matching algorithm. (optional, default `-1`)


### Examples

```js
var osrm = new OSRM("berlin-latest.osrm");
var options = {
    coordinates: [[52.542648,13.393252], [52.543079,13.394780], [52.542107,13.397389]],
    timestamps: [1424684612, 1424684616, 1424684620]
};
osrm.match(options, function(err, response) {
    if(err) throw err;
});
```

Returns `MatchResult` matchings array containing an object for each partial sub-matching of the trace.

## `osrm.nearest`

Computes the nearest street segment for a given coordinate.

### Parameters

* `Location` **`Array<Number>`** of the query point as latitude, longitude


### Examples

```js
var osrm = new OSRM("berlin-latest.osrm");
osrm.nearest([52.4224, 13.333086], function(err, result) {
    if(err) throw err;
});
```

Returns `NearestResult` 

## `osrm.table`

Computes distance tables for the given via points. Currently all pair-wise distances are computed. Please note that the distance in this case is the travel time which is the default metric used by OSRM.

### Parameters

* `Location` **`Array<Number>`** of the via point as latitude, longitude


### Examples

```js
var osrm = new OSRM({path: "berlin-latest.osrm", distance_table: 30000});
osrm.route({coordinates: [[52.519930,13.438640], [52.513191,13.415852]]}, function(err, route) {
    if(err) throw err;
});
```

Returns `DistanceTable` 

## ``

MatchResult


| name | type | description |
| ---- | ---- | ----------- |
| `matched_points` | `Array` | coordinates of the points snapped to the road network in [lat, lon] |
| `indices` | `Array` | array that gives the indices of the matched coordinates in the original trace |
| `geometry` | `String` | geometry of the matched trace in the road network, compressed as polyline, but with 6 decimals. You can use the npm module polyline to decompress it. |
| `confidence` | `Number` | value between 0 and 1, where 1 is very confident. Please note that the correctness of this value depends highly on the assumptions about the sample rate mentioned above. |



## ``

TableResult


| name | type | description |
| ---- | ---- | ----------- |
| `distance_table` | `Array<Array<Number>>` | array of arrays that stores the matrix in row-major order. `distance_table[i][j]` gives the travel time from the i-th via to the j-th via point. Values are given in 10th of a second. |



## ``

NearestResult


| name | type | description |
| ---- | ---- | ----------- |
| `status` | `Number` | Passed or failed. |
| `mapped_coordinate` | `Array<Number>` | Array that contains the [lat, lon] pair of the snapped coordinate. |
| `name` | `String` | Name of the street the coordinate snapped to. |



