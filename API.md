## `OSRM`

Creates a new `osrm` instance

### Parameters

* `options` **`Object`** Contructor object. Optionally, pass only the `path`
  * `options.path` **`String`** Path to .osrm preprocessed file.
  * `options.shared_memory` **`[Boolean]`** Allows you to share data among a number of processes and the shared memory used is persistent. It stays in the system until it is explicitly removed.
  * `options.distance_table` **`[String]`** The maximum number of locations in the distance table.


### Examples

```js
var OSRM = require('osrm');
var osrm = new OSRM('berlin-latest.osrm');
```

Returns `Object` The osrm instance.

## `osrm.locate`

Returns coordinate snapped to nearest node

### Parameters

* `point` **`Array<Number>`** latitude, longitude pair to locate on the network.


### Examples

```js
var osrm = new OSRM('berlin-latest.osrm');
osrm.locate([52.4224, 13.333086], function(err, result) {
    if(err) throw err;
});
```

Returns  node location of the node as latitude longitude pair.

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
var osrm = new OSRM('berlin-latest.osrm');
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

* `point` **`Array<Number>`** coordinates of the query point as a latitude, longitude array




## `osrm.route`

Computes a route between coordinates over the network.

### Parameters

* `options` **`Object`** options object
  * `options.coordinates` **`Array<Array<Number>>`** An array of number arrays expressing coordinate pairs as latitude, longitude.
  * `options.alternateRoute` **`[Boolean]`** Return an alternate route. (optional, default `false`)
  * `options.checksum` **`[Number]`** `Checksum` of the network dataset. (optional, default `0`)
  * `options.zoomLevel` **`[Number]`** Zoom level determines the level of generalization. The default zoom 18 performs no generalization. (optional, default `18`)
  * `options.printInstructions` **`[Boolean]`** Include turn by turn instructions. (optional, default `false`)
  * `options.geometry` **`[Boolean]`** Include the geometry of the route. (optional, default `true`)
  * `options.jsonpParameter` **`[String]`** Format results with jsonp. (optional, default `&quot;&quot;`)
  * `options.hints` **`[Array<String>]`** `Polylines` that can be used to speed up incremental queries, where only a few via nodes change.


### Examples

```js
var osrm = new OSRM("berlin-latest.osrm");
osrm.route({coordinates: [[52.519930,13.438640], [52.513191,13.415852]]}, function(err, route) {
    if(err) throw err;
});
```

Returns `RouteResult` matchings array containing an object for each partial sub-matching of the trace.

## `osrm.table`

Computes distance tables for the given via points. Currently all pair-wise distances are computed. Please note that the distance in this case is the travel time which is the default metric used by OSRM.

### Parameters

* `Array` **`Array<Array<Number>>`** of coordinate pairs as latitude, longitude representing the via points to be computed.


### Examples

```js
var osrm = new OSRM("berlin-latest.osrm");
var options = {
    coordinates: [[52.519930,13.438640], [52.513191,13.415852]]
};   
osrm.table(options, function(err, table) {
    if(err) throw err
});
```

Returns `TableResult` 

## ``

RouteResult


| name | type | description |
| ---- | ---- | ----------- |
| `Line` | `Array` |  |



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



