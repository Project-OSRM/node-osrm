## `OSRM`

Creates a new `osrm` instance

### Parameters

* `options` **`Object`** An object containing osrm options.
  * `options.path` **`String`** Path to the [.osrm preprocessed file](https://github.com/Project-OSRM/osrm-backend/wiki/Running-OSRM#creating-the-hierarchy). If `path` is the the only option, it can be used directly as a string.
  * `options.shared_memory` **`[Boolean]`** Allows you to share data among a number of processes and the shared memory used is persistent. It stays in the system until it is explicitly removed. Use `osrm-datastore` to load new data into memory. Conflicts with `path`.


### Examples

```js
var OSRM = require('osrm');

var osrm = new OSRM('berlin-latest.osrm');
var osrm = new OSRM({shared_memory: true});
var osrm = new OSRM(); // same as above
var osrm = new OSRM({path: 'berlin-latest.osrm', shared_memory: true}); // Error only can use either
```

Returns `Object` The osrm instance.

## `osrm.match`

Matches given coordinates to the road network

### Parameters

* `options` **`Object`** Object literal containing parameters for the match query.
  * `options.coordinates` **`Array<Array<Number>>`** The point to match as a latitude, longitude array.
  * `options.bearings` **`Array<Number>`** or **`Array<Array<Number>>`** Either list of approximate bearing values of the segments to snap to or `[bearing, range]`
  * `options.timestamps` **`Array<Number>`** An array of UNIX style timestamps corresponding to the input coordinates (eg: 1424684612).
  * `options.classify` **`[Boolean]`** Return a confidence value for this matching. (optional, default `false`)
  * `options.gps_precision` **`[Number]`** Specify gps precision as standart deviation in meters. (optional, default `5`)
  * `options.matching_beta` **`[Number]`** Specify beta value for matching algorithm. (optional, default `5`)

For other parameters see [osrm.route Parameters](#route_parameters). `trip` does not support computing alternatives.

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

## Errors

* `No route found` No route between the given coordinates could be found.
* `Could not find a matching segment for coordinate` There is not street segment that matches the filters provided.

Returns `Object` containing `matchings` Array of `MatchResult`

## `osrm.nearest`

Computes the nearest street segment for a given coordinate.

### Parameters

* `point` **`Array<Number>`** coordinates of the query point as a latitude, longitude array


### Examples

```js
var osrm = new OSRM('berlin-latest.osrm');
osrm.nearest([52.542648,13.393252], function(err, response) {
    if(err) throw err;
});
```

Returns `NearestResult` object

## `osrm.route`

Computes a route between coordinates over the network.

### Parameters <a name="route_parameters"></a>

* `options` **`Object`** Object literal containing parameters for the route query.
  * `options.coordinates` **`Array<Array<Number>>`** Via points to route represented by an array of number arrays expressing coordinate pairs as latitude, longitude.
  * `options.bearings` **`Array<Number>`** or **`Array<Array<Number>>`** Either list of approximate bearing values of the segments to snap to or `[bearing, range]`
  * `options.alternateRoute` **`[Boolean]`** Return an alternate route. (optional, default `false`)
  * `options.checksum` **`[Number]`** [Checksum](https://en.wikipedia.org/wiki/Checksum) of the network dataset.
  * `options.zoomLevel` **`[Number]`** Determines the level of generalization. The default zoom 18 performs no generalization. (optional, default `18`)
  * `options.printInstructions` **`[Boolean]`** Include turn by turn instructions. (optional, default `false`)
  * `options.geometry` **`[Boolean]`** Include the geometry of the route. (optional, default `true`)
  * `options.compression` **`[Boolean]`** Compress route geometry as a polyline; geometry is an array of [lat, lng] pairs if false. (optional, default `true`)
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

* `options` **`Object`** Object literal containing parameters for the table query.
  * `options.coordinates` **`Array<Array<Number>>`** Array of coordinate pairs as latitude, longitude representing the via points to be computed.
  * `options.sources` **`Array<Array<Number>>`** Array of coordinate pairs as latitude, longitude representing the via points to be computed. Conflicts with `coordinates`.
  * `options.destinations` **`Array<Array<Number>>`** Array of coordinate pairs as latitude, longitude representing the via points to be computed. Conflicts with `coordinates`.


### Examples

Computes a 2x2 matrix.

```js
var osrm = new OSRM("berlin-latest.osrm");
var options = {
    coordinates: [[52.519930,13.438640], [52.513191,13.415852]]
};
osrm.table(options, function(err, table) {
    if(err) throw err
});
```

Computes a 1x2 matrix.

```js
var osrm = new OSRM("berlin-latest.osrm");
var options = {
    sources: [[52.519930,13.438640]],
    destinations: [[52.519930,13.438640], [52.513191,13.415852]]
};
osrm.table(options, function(err, table) {
    if(err) throw err
});
```

Returns `TableResult` object.

## `osrm.trip`

Calculates a short roundtrip that visits every given coordinate.

### Parameters

* `options` **`Object`** Object literal containing parameters for the trip query.
* `options.coordinates` **`Array<Array<Number>>`** The point to match as a latitude, longitude array.

For other parameters see [osrm.route Parameters](#route_parameters). `trip` does not support computing alternatives.

### Examples

```js
var osrm = new OSRM('berlin-latest.osrm');
var options = {
    coordinates: [[52.542648,13.393252], [52.543079,13.394780], [52.542107,13.397389]]};
osrm.trip(options, function(err, response) {
    if(err) throw err;
});
```

Returns `TripResult`.


## `MatchResult`




| name | type | description |
| ---- | ---- | ----------- |
| `matched_points` | `Array<Array<Number>>` | Coordinates the points snapped to the road network as latitude, longitude pairs. |
| `matched_names` | `Array<String>` | Name of the street the points snapped to. |
| `indices` | `Array<Number>` | Array that gives the indices of the matched coordinates in the original trace. |
| `geometry` | `String` | Geometry of the matched trace in the road network, compressed as a [polyline](https://github.com/mapbox/polyline) with 6 decimals of precision. |
| `confidence` | `Number` | Value between 0 and 1, where 1 is very confident. Please note that the correctness of this value depends highly on [the assumptions about the sample rate](https://github.com/Project-OSRM/osrm-backend/wiki/Server-api#service-match). |



## `NearestResult`




| name | type | description |
| ---- | ---- | ----------- |
| `mapped_coordinate` | `Array<Number>` | Array that contains the latitude, longitude pair for the snapped coordinate. |
| `name` | `String` | Name of the street the coordinate snapped to. |




## `RouteResult`




| name | type | description |
| ---- | ---- | ----------- |
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
| `hint_data.locations` | `Array<String>` | An array of Base64 strings used for incremental hinting. |
| `hint_data.checksum` | `Number` | [Checksum](https://en.wikipedia.org/wiki/Checksum) of the network dataset. |
| `route_instructions` | `Array<Array>** | Array of route instructions. |



## `TableResult`




| name | type | description |
| ---- | ---- | ----------- |
| `distance_table` | `Array<Array<Number>>` | Array of arrays that stores the matrix in [row-major order](https://en.wikipedia.org/wiki/Row-major_order). `distance_table[i][j]` gives the travel time from the i-th via to the j-th via point. Values are given in 10th of a second. |
| `source_coodinates` | `Array<Array<Number>>` | Array of `[lat, lon]` pairs representing the snapped coordinate of the source for each row. |
| `destination_coodinates` | `Array<Array<Number>>` | Array of `[lat, lon]` pairs representing the snapped coordinate of the destination for each column. |


