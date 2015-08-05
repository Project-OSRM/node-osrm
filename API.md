## `MatchResult`




| name | type | description |
| ---- | ---- | ----------- |
| `matched_points` | `Array<Array<Number>>` | Coordinates the points snapped to the road network as latitude, longitude pairs. |
| `indices` | `Array<Number>` | Array that gives the indices of the matched coordinates in the original trace. |
| `geometry` | `String` | Geometry of the matched trace in the road network, compressed as a [polyline](https://github.com/mapbox/polyline) with 6 decimals of precision. |
| `confidence` | `Number` | Value between 0 and 1, where 1 is very confident. Please note that the correctness of this value depends highly on [the assumptions about the sample rate](https://github.com/Project-OSRM/osrm-backend/wiki/Server-api#service-match). |



## `NearestResult`




| name | type | description |
| ---- | ---- | ----------- |
| `status` | `Number` | 0 if passed, undefined if failed. |
| `mapped_coordinate` | `Array<Number>` | Array that contains the latitude, longitude pair for the snapped coordinate. |
| `name` | `String` | Name of the street the coordinate snapped to. |



## `OSRM`

Creates a new `osrm` instance

### Parameters

* `options` **`Object`** An object containing osrm options.
  * `options.path` **`String`** Path to the [.osrm preprocessed file](https://github.com/Project-OSRM/osrm-backend/wiki/Running-OSRM#creating-the-hierarchy). If `path` is the the only option, it can be used directly as a string.
  * `options.shared_memory` **`[Boolean]`** Allows you to share data among a number of processes and the shared memory used is persistent. It stays in the system until it is explicitly removed.
  * `options.distance_table` **`[Number]`** The maximum number of locations in the distance table.


### Examples

```js
var OSRM = require('osrm');
var osrm = new OSRM('berlin-latest.osrm');
```

Returns `Object` The osrm instance.

## `osrm.locate`

Returns coordinate snapped to nearest node

### Parameters

* `point` **`Array<Number>`** Latitude, longitude pair to locate on the network.


### Examples

```js
var osrm = new OSRM('berlin-latest.osrm');
osrm.locate([52.4224, 13.333086], function(err, result) {
    if(err) throw err;
});
```

Returns  node Location of the nearest node as a latitude, longitude pair.

## `osrm.match`

Matches given coordinates to the road network

### Parameters

* `coordinates` **`Array<Array<Number>>`** The point to match as a latitude, longitude array.
* `timestamps` **`Array<Number>`** An array of UNIX style timestamps corresponding to the input coordinates (eg: 1424684612).
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

Returns  matchings Array of MatchResults, each containing an object for a partial sub-matching of the trace.

## `osrm.nearest`

Computes the nearest street segment for a given coordinate.

### Parameters

* `point` **`Array<Number>`** coordinates of the query point as a latitude, longitude array




## `osrm.route`

Computes a route between coordinates over the network.

### Parameters

* `options` **`Object`** Object literal containing parameters for the route query.
  * `options.coordinates` **`Array<Array<Number>>`** Via points to route represented by an array of number arrays expressing coordinate pairs as latitude, longitude.
  * `options.alternateRoute` **`[Boolean]`** Return an alternate route. (optional, default `false`)
  * `options.checksum` **`[Number]`** [Checksum](https://en.wikipedia.org/wiki/Checksum) of the network dataset.
  * `options.zoomLevel` **`[Number]`** Determines the level of generalization. The default zoom 18 performs no generalization. (optional, default `18`)
  * `options.printInstructions` **`[Boolean]`** Include turn by turn instructions. (optional, default `false`)
  * `options.geometry` **`[Boolean]`** Include the geometry of the route. (optional, default `true`)
  * `options.hints` **`[Array<String>]`** [Polylines](https://github.com/mapbox/polyline) that can be used to speed up incremental queries, where only a few via nodes change.


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

* `coordinates` **`Array<Array<Number>>`** Array of coordinate pairs as latitude, longitude representing the via points to be computed.


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

## `RouteResult`




| name | type | description |
| ---- | ---- | ----------- |
| `status` | `Number` | 0 if passed, undefined if failed. |
| `status_message` | `String` | Information about the query results. |
| `via_indices` | `Array<Number>` | Array of node indices corresponding to the via coordinates. |
| `route_geometry` | `String` | Geometry of the suggested route, compressed as a [polyline](https://github.com/mapbox/polyline). |
| `route_summary` | `Object` | Object literal containing an overview of the suggested route. |
| `route_summary.start_point` | `String` | Human readable name of the start location. |
| `route_summary.end_point` | `String` | Human readable name of the end location. |
| `route_summary.total_time` | `Number` | Total time of the trip in seconds. |
| `route_summary.total_distance` | `Number` | Total distance of the trip in meters. |
| `via_points` | `Array<Array<Number>>` | Array of latitude, longitude Array pairs representing the routed points. |
| `found_alternative` | `Boolean` | Value will be `true` if an alternitive route was requested and found. Set options.alternateRoute to `true` to attempt to find an alternate route. |
| `route_name` | `Array<String>` | An array of the most prominent street names along the route. |
| `hint_data` | `Object` | Object literal containing necessary data for speeding up similar queries. |
| `hint_data.locations` | `Array<String>` | An array of [polyline](https://github.com/mapbox/polyline) strings used for incremental hinting. |
| `hint_data.checksum` | `Number` | [Checksum](https://en.wikipedia.org/wiki/Checksum) of the network dataset. |



## `TableResult`




| name | type | description |
| ---- | ---- | ----------- |
| `distance_table` | `Array<Array<Number>>` | Array of arrays that stores the matrix in [row-major order](https://en.wikipedia.org/wiki/Row-major_order). `distance_table[i][j]` gives the travel time from the i-th via to the j-th via point. Values are given in 10th of a second. |



