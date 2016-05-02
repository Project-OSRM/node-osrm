# OSRM

The `OSRM` method is the main constructor for creating an OSRM instance. An OSRM instance requires a `.osrm` network,
which is prepared by the OSRM Backend C++ library. Once you have a complete `network.osrm` file, you can calculate
networks in javascript with this library using the methods below. To create an OSRM instance with your network
you need to construct an instance like this:

```javascript
var osrm = new OSRM('network.osrm');
```

#### Methods

| Service                    | Description                                               |
| -------------------------- | --------------------------------------------------------- |
| [`osrm.route`](#route)     | shortest path between given coordinates                   |
| [`osrm.nearest`](#nearest) | returns the nearest street segment for a given coordinate |
| [`osrm.table`](#table)     | computes distance tables for given coordinates            |
| [`osrm.match`](#match)     | matches given coordinates to the road network             |
| [`osrm.trip`](#trip)       | Compute the shortest round trip between given coordinates |
| [`osrm.tile`](#tile)       | Return vector tiles containing debugging info             |

#### General Options

Each OSRM method (except for `OSRM.tile()`) has set of general options as well as unique options, outlined below.

| Option      | Values                                                  | Description                                                                                            | Format                                                                         |
| ----------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| coordinates | `array` of `coordinate` elements: `[{coordinate}, ...]` | The coordinates this request will use.                                                                 | `array` with `[{lon},{lat}]` values, in decimal degrees                        |
| bearings    | `array` of `bearing` elements: `[{bearing}, ...]`       | Limits the search to segments with given bearing in degrees towards true north in clockwise direction. | `null` or `array` with `[{value},{range}]` `integer 0 .. 360,integer 0 .. 180` |
| radiuses    | `array` of `radius` elements: `[{radius}, ...]`         | Limits the search to given radius in meters.                                                           | `null` or `double >= 0` or `unlimited` (default)                               |
| hints       | `array` of `hint` elements: `[{hint}, ...]`             | Hint to derive position in street network.                                                             | Base64 `string`                                                                |

## route

Returns the fastest route between two or more coordinates while visiting the waypoints in order.

**Parameters**

-   `options` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** Object literal containing parameters for the route query.
    -   `options.alternatives` **\[[Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)]** Search for alternative routes and return as well. _Please note that even if an alternative route is requested, a result cannot be guaranteed._ (optional, default `false`)
    -   `options.steps` **\[[Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)]** Return route steps for each route leg. (optional, default `false`)
    -   `options.geometries` **\[[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)]** Returned route geometry format (influences overview and per step). Can also be `geojson`. (optional, default `polyline`)
    -   `options.overview` **\[[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)]** Add overview geometry either `full`, `simplified` according to highest zoom level it could be display on, or not at all (`false`). (optional, default `simplified`)
    -   `options.continue_straight` **\[[Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)]** Forces the route to keep going straight at waypoints and don't do a uturn even if it would be faster. Default value depends on the profile. `null`/`true`/`false`
-   `callback` **[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)** 

**Examples**

```javascript
var osrm = new OSRM("berlin-latest.osrm");
osrm.route({coordinates: [[52.519930,13.438640], [52.513191,13.415852]]}, function(err, result) {
  if(err) throw err;
  console.log(result.waypoints); // array of Waypoint objects representing all waypoints in order
  console.log(result.routes); // array of Route objects ordered by descending recommendation rank
});
```

Returns **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** An array of [Waypoint](#waypoint) objects representing all waypoints in order AND an array of [`Route`](#route) objects ordered by descending recommendation rank.

## nearest

Snaps a coordinate to the street network and returns the nearest n matches.

Note: `coordinates` in the general options only supports a single `{longitude},{latitude}` entry.

**Parameters**

-   `options` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** Object literal containing parameters for the nearest query.
    -   `options.number` **\[[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)]** Number of nearest segments that should be returned.
        Must be an integer greater than or equal to `1`. (optional, default `1`)
-   `callback` **[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)** 

**Examples**

```javascript
var osrm = new OSRM('network.osrm');
var options = {
  coordinates: [[13.388860,52.517037]],
  number: 3,
  bearings: [[0,20]]
};
osrm.nearest(options, function(err, response) {
  console.log(response.waypoints); // array of Waypoint objects
});
```

Returns **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** containing `waypoints`.
**`waypoints`**: array of [`Ẁaypoint`](#waypoint) objects sorted by distance to the input coordinate.
Each object has an additional `distance` property, which is the distance in meters to the supplied
input coordinate.

## table

Computes duration tables for the given locations. Allows for both symmetric and asymmetric tables.

**Parameters**

-   `options` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** Object literal containing parameters for the table query.
    -   `options.sources` **\[[Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)]** An array of `index` elements (`0 <= integer < #coordinates`) to use
        location with given index as source. Default is to use all.
    -   `options.destinations` **\[[Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)]** An array of `index` elements (`0 <= integer < #coordinates`) to use location with given index as destination. Default is to use all.
-   `callback` **[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)** 

**Examples**

```javascript
var osrm = new OSRM('network.osrm');
var options = {
  coordinates: [
    [13.388860,52.517037],
    [13.397634,52.529407],
    [13.428555,52.523219]
  ]
};
osrm.table(options, function(err, response) {
  console.log(response.durations); // array of arrays, matrix in row-major order
  console.log(response.sources); // array of Waypoint objects
  console.log(response.destinations); // array of Waypoint objects
});
```

Returns **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** containing `durations`, `sources`, and `destinations`.
**`durations`**: array of arrays that stores the matrix in row-major order. `durations[i][j]`
gives the travel time from the i-th waypoint to the j-th waypoint. Values are given in seconds.
**`sources`**: array of [`Ẁaypoint`](#waypoint) objects describing all sources in order.
**`destinations`**: array of [`Ẁaypoint`](#waypoint) objects describing all destinations in order.

## tile

This generates [Mapbox Vector Tiles](https://mapbox.com/vector-tiles) that can be viewed with a
vector-tile capable slippy-map viewer. The tiles contain road geometries and metadata that can
be used to examine the routing graph. The tiles are generated directly from the data in-memory,
so are in sync with actual routing results, and let you examine which roads are actually routable,
and what weights they have applied.

**Parameters**

-   `ZXY` **[Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)** an array consisting of `x`, `y`, and `z` values representing tile coordinates like
    [wiki.openstreetmap.org/wiki/Slippy_map_tilenames](https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames)
    and are supported by vector tile viewers like [Mapbox GL JS]\(<https://www.mapbox.com/mapbox-gl-js/api/>.
-   `callback` **[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)** 

**Examples**

```javascript
var osrm = new OSRM('network.osrm');
osrm.tile([0, 0, 0], function(err, response) {
  if (err) throw err;
  fs.writeFileSync('./tile.vector.pbf', response); // write the buffer to a file
});
```

Returns **[Buffer](https://nodejs.org/api/buffer.html)** contains a Protocol Buffer encoded vector tile.

## match

Map matching matches given GPS points to the road network in the most plausible way.
Please note the request might result multiple sub-traces. Large jumps in the timestamps
(>60s) or improbable transitions lead to trace splits if a complete matching could
not be found. The algorithm might not be able to match all points. Outliers are removed
if they can not be matched successfully.

**Parameters**

-   `options` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** Object literal containing parameters for the match query.
    -   `options.steps` **\[[Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)]** Return route steps for each route. (optional, default `false`)
    -   `options.geometries` **\[[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)]** Returned route geometry format (influences overview
        and per step). Can also be `geojson`. (optional, default `polyline`)
    -   `options.overview` **\[[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)]** Add overview geometry either `full`, `simplified`
        according to highest zoom level it could be display on, or not at all (`false`). (optional, default `simplified`)
    -   `options.timestamps` **\[[Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)&lt;[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)>]** Timestamp of the input location (integers, UNIX-like timestamp).
    -   `options.radiuses` **\[[Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)]** Standard deviation of GPS precision used for map matching.
        If applicable use GPS accuracy (`double >= 0`, default `5m`).
-   `callback` **[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)** 

**Examples**

```javascript
var osrm = new OSRM('network.osrm');
var options = {
    coordinates: [[13.393252,52.542648],[13.39478,52.543079],[13.397389,52.542107]],
    timestamps: [1424684612, 1424684616, 1424684620]
};
osrm.match(options, function(err, response) {
    if (err) throw err;
    console.log(response.tracepoints); // array of Waypoint objects
    console.log(response.matchings); // array of Route objects
});
```

Returns **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** containing `tracepoints` and `matchings`.
**`tracepoints`** Array of [`Ẁaypoint`](#waypoint) objects representing all points of the trace in order.
If the trace point was ommited by map matching because it is an outlier, the entry will be null. Each
`Waypoint` object includes two additional properties, 1) `matchings_index`: Index to the
[`Route`](#route) object in matchings the sub-trace was matched to, 2) `waypoint_index`: Index of
the waypoint inside the matched route.
**`matchings`** is an array of [`Route`](#route) objects that
assemble the trace. Each `Route` object has an additional `confidence` property, which is the confidence of
the matching. float value between `0` and `1`. `1` is very confident that the matching is correct.

## trip

The trip plugin solves the Traveling Salesman Problem using a greedy heuristic (farthest-insertion algorithm).
The returned path does not have to be the shortest path, as TSP is NP-hard it is only an approximation.
Note that if the input coordinates can not be joined by a single trip (e.g. the coordinates are on several
disconnected islands) multiple trips for each connected component are returned.

**Parameters**

-   `options` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** Object literal containing parameters for the trip query.
    -   `options.steps` **\[[Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)]** Return route steps for each route. (optional, default `false`)
    -   `options.geometries` **\[[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)]** Returned route geometry format (influences overview
        and per step). Can also be `geojson`. (optional, default `polyline`)
    -   `options.overview` **\[[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)]** Add overview geometry either `full`, `simplified` (optional, default `simplified`)
-   `callback` **[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)** 

**Examples**

```javascript
var osrm = new OSRM('network.osrm');
var options = {
  coordinates: [
    [13.36761474609375, 52.51663871100423],
    [13.374481201171875, 52.506191342034576]
  ]
}
osrm.trip(options, function(err, response) {
  if (err) throw err;
  console.log(response.waypoints); // array of Waypoint objects
  console.log(response.trips); // array of Route objects
});
```

Returns **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** containing `waypoints` and `trips`.
**`waypoints`**: an array of [`Ẁaypoint`](#waypoint) objects representing all waypoints in input order.
Each Waypoint object has the following additional properties, 1) `trips_index`: index to trips of the
sub-trip the point was matched to, and 2) `waypoint_index`: index of the point in the trip.
**`trips`**: an array of [`Route`](#route) objects that assemble the trace.

# Responses

Responses

## Route

Represents a route through (potentially multiple) waypoints.

**Properties**

-   `distance` **[number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)** The distance traveled by the route, in `float` meters.
-   `duration` **[number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)** The estimated travel time, in `float` number of seconds.
-   `geometry` **[number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)** The whole geometry of the route value depending on overview parameter,
    format depending on the geometries parameter. See [`RouteStep`'s](#routestep) geometry field for a parameter documentation.
-   `legs` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** The legs between the given waypoints, an array of [`RouteLeg`](#routeleg) objects.

**Examples**

```javascript
// Three input coordinates, geometry=geojson, steps=false
{
  distance: 90.,
  duration: 300.,
  geometry: {type: LineString, coordinates: [[120., 10.], [120.1, 10.], [120.2, 10.], [120.3, 10.]]},
  legs: [
    {
      distance: 30.,
      duration: 100,
      steps: []
    },
    {
      distance: 60.,
      duration: 200,
      steps: []
    }
  ]
}
```

## RouteLeg

Represents a route between two waypoints.

**Properties**

-   `distance` **[number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)** The distance traveled by the route, in `float` meters.
-   `duration` **[number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)** The estimated travel time, in `float` number of seconds.
-   `summary` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** Summary of the route taken as string. Depends on the `steps` parameter.
    Provides the names of the two major roads used. Can be empty if route is too short.
-   `steps` **[Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)** array of [`RouteStep`](#routestep) objects describing the turn-by-turn
    instructions. Depends on the `steps` parameter.

**Examples**

```javascript
// with steps=false
{
  distance: 30.,
  duration: 100,
  steps: []
}
```

## RouteStep

A step consists of a maneuver such as a turn or merge, followed by a distance of travel along a single way to the subsequent step.

**Properties**

-   `distance` **[number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)** The distance traveled by the route, in `float` meters.
-   `duration` **[number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)** The estimated travel time, in `float` number of seconds.
-   `geometry` **[number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)** The unsimplified geometry of the route segment, depending
    on the `geometries` parameter.
-   `name` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** The name of the way along which travel proceeds.
-   `mode` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** A string signifying the mode of transportation.
-   `maneuver` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** A [`StepManeuver`](#stepmaneuver) object representing the maneuver.

## StepManeuver

Information about a specific maneuver, including bearings and type.

#### Maneuver `type` descriptions

| `type`       | Description                                                                                    |
| ------------ | ---------------------------------------------------------------------------------------------- |
| turn         | a basic turn into direction of the `modifier`                                                  |
| new name     | no turn is taken, but the road name changes                                                    |
| depart       | indicates the departure of the leg                                                             |
| arrive       | indicates the destination of the leg                                                           |
| merge        | merge onto a street (e.g. getting on the highway from a ramp                                   |
| ramp         | take a ramp to exit a highway                                                                  |
| fork         | take the left/right side at a fork depending on `modifier`                                     |
| end of road  | road ends in a T intersection turn in direction of `modifier`                                  |
| continue     | Turn in direction of `modifier` to stay on the same road                                       |
| roundabout   | traverse roundabout, has additional field `exit` with NR if the roundabout is left.            |
| rotary       | a larger version of a roundabout, can offer `rotary_name` in addition to the `exit` parameter. |
| notification | not an actual turn but a change in the driving conditions. For example the travel mode.        |

Please note that even though there are `new name` and `notification` instructions, the `mode` and `name` can change
between all instructions. They only offer a fallback in case nothing else is to report.

#### `modifier` descriptions

| `modifier`   | Description                      |
| ------------ | -------------------------------- |
| uturn        | indicates  reversal of direction |
| sharp right  | a sharp right turn               |
| right        | a normal turn to the right       |
| slight right | a slight turn to the right       |
| straight     | no relevant change in direction  |
| slight left  | a slight turn to the left        |
| left         | a normal turn to the left        |
| sharp left   | a sharp turn to the left         |

**Properties**

-   `location` **[Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)** A `[longitude, latitude]` pair describing the location of the turn.
-   `bearing_before` **[number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)** The clockwise angle from true north to the direction of travel
    immediately before the maneuver.
-   `bearing_after` **[number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)** The clockwise angle from true north to the direction of travel
    immediately after the maneuver.
-   `type` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** A string indicating the [type of maneuver](#maneuver-type-descriptions).
-   `modifier` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** An optional string indicating the direction change of the maneuver. See the
    [modifier types](#modifier-type-descriptions). The meaning depends on the `type` field.
    `turn`: `modifier` indicates the change in direction accomplished through the turn.
    `depart`/`arrive`: `modifier` indicates the position of departure point and arrival point in relation
    to the current direction of travel.
-   `exit` **[number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)** An optional integer indicating number of the exit to take.
    The field exists for the following `type` field:
    `roundabout`: number of the roundabout exit to take. If exit is undefined the destination is on the roundabout.
    `turn` or `end of road`: Indicates the number of intersections passed until the turn.
    Example instruction: "at the fourth intersection, turn left".

## Waypoint

Object used to describe waypoint on a route.

**Properties**

-   `name` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** Name of the street the coordinate snapped to.
-   `location` **[Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)** Array that contains the `[longitude, latitude]` pair of the snapped coordinate.
-   `hint` **[number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)** Unique internal identifier of the segment (ephemeral, not constant over data updates)
    This can be used on subsequent request to significantly speed up the query and to connect multiple services.
    E.g. you can use the `hint` value obtained by the `nearest` query as `hint` values for `route` inputs.
