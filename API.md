## `osrm.match`

Matches given coordinates to the road network

### Parameters

* `loc` **`[String]`** Location of the point. (optional, default `52.542648,13.393252`)
* `t` **`[String]`** Timestamp of the preceding point. (optional, default `1424684612`)
* `geometry` **`[Boolean]`** Return route geometry. (optional, default `true`)
* `classify` **`[Boolean]`** Return a confidence value for this matching. (optional, default `false`)
* `gps_precision` **`[Number]`** Specify gps precision as standart deviation in meters. (optional, default `-1`)
* `matching_beta` **`[Number]`** Specify beta value for matching algorithm. (optional, default `-1`)
* `matchings` **`Object`** array containing an object for each partial sub-matching of the trace.
  * `matchings.matched_points` **`Array`** coordinates of the points snapped to the road network in [lat, lon]


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

Returns `Object` matchings array containing an object for each partial sub-matching of the trace.
Returns `Array` matchings.matched_points coordinates of the points snapped to the road network in [lat, lon]
Returns `Array` matchings.indices array that gives the indices of the matched coordinates in the original trace
Returns `String` matchings.geometry geometry of the matched trace in the road network, compressed as polyline, but with 6 decimals. You can use the npm module polyline to decompress it.
Returns `Number` matchings.confidence value between 0 and 1, where 1 is very confident. Please note that the correctness of this value depends highly on the assumptions about the sample rate mentioned above.

## `osrm.route`

Matches given coordinates to the road network

### Parameters

* `loc` **`[String]`** Location of the point. (optional, default `52.542648,13.393252`)
* `t` **`[String]`** Timestamp of the preceding point. (optional, default `1424684612`)
* `geometry` **`[Boolean]`** Return route geometry. (optional, default `true`)
* `classify` **`[Boolean]`** Return a confidence value for this matching. (optional, default `false`)
* `gps_precision` **`[Number]`** Specify gps precision as standart deviation in meters. (optional, default `-1`)
* `matching_beta` **`[Number]`** Specify beta value for matching algorithm. (optional, default `-1`)
* `matchings` **`Object`** array containing an object for each partial sub-matching of the trace.
  * `matchings.matched_points` **`Array`** coordinates of the points snapped to the road network in [lat, lon]

| name | type | description |
| ---- | ---- | ----------- |
| `matched_points` | `Array` | coordinates of the points snapped to the road network in [lat, lon] |
| `indices` | `Array` | array that gives the indices of the matched coordinates in the original trace |
| `geometry` | `String` | geometry of the matched trace in the road network, compressed as polyline, but with 6 decimals. You can use the npm module polyline to decompress it. |
| `confidence` | `Number` | value between 0 and 1, where 1 is very confident. Please note that the correctness of this value depends highly on the assumptions about the sample rate mentioned above. |

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

Returns `Matching` matchings array containing an object for each partial sub-matching of the trace.

