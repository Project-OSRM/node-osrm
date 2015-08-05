#include "json_v8_renderer.hpp"

// v8
#include <nan.h>

// OSRM
#include <osrm/json_container.hpp>
#include <osrm/libosrm_config.hpp>
#include <osrm/osrm.hpp>
#include <osrm/route_parameters.hpp>

// STL
#include <iostream>
#include <memory>

namespace node_osrm {

typedef std::unique_ptr<OSRM> osrm_ptr;
typedef std::unique_ptr<RouteParameters> route_parameters_ptr;
namespace {
template <class T, class... Types>
std::unique_ptr<T> make_unique(Types &&... Args)
{
    return (std::unique_ptr<T>(new T(std::forward<Types>(Args)...)));
}
}

using namespace v8;

class Engine final : public node::ObjectWrap {
public:
    static Persistent<FunctionTemplate> constructor;
    static void Initialize(Handle<Object>);
    static NAN_METHOD(New);
    static NAN_METHOD(route);
    static NAN_METHOD(locate);
    static NAN_METHOD(nearest);
    static NAN_METHOD(table);
    static NAN_METHOD(match);
    static NAN_METHOD(trip);

    static void Run(_NAN_METHOD_ARGS, route_parameters_ptr);
    static void AsyncRun(uv_work_t*);
    static void AfterRun(uv_work_t*);

private:
    Engine(libosrm_config &lib_config)
        : ObjectWrap(),
          this_(make_unique<OSRM>(lib_config))
    {}

    osrm_ptr this_;
};

Persistent<FunctionTemplate> Engine::constructor;

void Engine::Initialize(Handle<Object> target) {
    NanScope();
    Local<FunctionTemplate> lcons = NanNew<FunctionTemplate>(Engine::New);
    lcons->InstanceTemplate()->SetInternalFieldCount(1);
    lcons->SetClassName(NanNew("OSRM"));
    NODE_SET_PROTOTYPE_METHOD(lcons, "route", route);
    NODE_SET_PROTOTYPE_METHOD(lcons, "locate", locate);
    NODE_SET_PROTOTYPE_METHOD(lcons, "nearest", nearest);
    NODE_SET_PROTOTYPE_METHOD(lcons, "table", table);
    NODE_SET_PROTOTYPE_METHOD(lcons, "match", match);
    NODE_SET_PROTOTYPE_METHOD(lcons, "trip", trip);
    lcons->Set(NanNew("libosrm_version"), NanNew(LIBOSRM_GIT_REVISION));
    target->Set(NanNew("OSRM"), lcons->GetFunction());
    NanAssignPersistent(constructor, lcons);
}

/**
 * Creates a new `osrm` instance
 *
 * @class OSRM
 * @name OSRM
 *
 * @param {Object} options An object containing osrm options.
 * @param {String} options.path Path to the [.osrm preprocessed file](https://github.com/Project-OSRM/osrm-backend/wiki/Running-OSRM#creating-the-hierarchy). If `path` is the the only option, it can be used directly as a string.
 * @param {Boolean} [options.shared_memory] Allows you to share data among a number of processes and the shared memory used is persistent. It stays in the system until it is explicitly removed.
 * @param {Number} [options.distance_table] The maximum number of locations in the distance table.
 * 
 * @returns {Object} The osrm instance.
 *
 * @example
 * var OSRM = require('osrm');
 * var osrm = new OSRM('berlin-latest.osrm');
 * 
 */
NAN_METHOD(Engine::New)
{
    NanScope();

    if (!args.IsConstructCall()) {
        NanThrowTypeError("Cannot call constructor as function, you need to use 'new' keyword");
        NanReturnUndefined();
    }

    try {
        libosrm_config lib_config;
        if (args.Length() == 1) {
            std::string base;
            bool shared_memory_defined = false;
            if (args[0]->IsString()) {
                base = *String::Utf8Value(args[0]->ToString());
            } else if (args[0]->IsObject()) {
                Local<Object> params = args[0]->ToObject();

                Local<Value> path = params->Get(NanNew("path"));
                if (!path->IsUndefined()) {
                    base = *String::Utf8Value(path->ToString());
                }

                Local<Value> max_locations_distance_table = params->Get(NanNew("distance_table"));
                if (!max_locations_distance_table->IsUndefined()) {
                    if (!max_locations_distance_table->IsUint32()) {
                        NanThrowError("the maximum number of locations in the distance table must be an unsigned integer");
                        NanReturnUndefined();
                    } else {
                        lib_config.max_locations_distance_table = max_locations_distance_table->ToUint32()->Value();
                    }
                }

                Local<Value> shared_memory = params->Get(NanNew("shared_memory"));
                if (!shared_memory->IsUndefined()) {
                    if (!shared_memory->IsBoolean()) {
                        NanThrowError("shared_memory option must be a boolean");
                        NanReturnUndefined();
                    } else {
                        lib_config.use_shared_memory = shared_memory->ToBoolean()->Value();
                        if (base.empty() && lib_config.use_shared_memory == false) {
                            NanThrowError("shared_memory must be enabled if no path is specified");
                            NanReturnUndefined();
                        }
                        shared_memory_defined = true;
                    }
                }

            } else {
                NanThrowError("first argument must be a path string or params object");
                NanReturnUndefined();
            }

            if (!base.empty()) {
                lib_config.server_paths["base"] = base;
            }
            if (shared_memory_defined == false && !base.empty()) {
                lib_config.use_shared_memory = false;
            }
        }
        auto im = new Engine(lib_config);
        im->Wrap(args.This());
        NanReturnValue(args.This());
    } catch (std::exception const& ex) {
         NanThrowTypeError(ex.what());
         NanReturnUndefined();
    }
}

struct RunQueryBaton {
    uv_work_t request;
    Engine * machine;
    osrm::json::Object result;
    route_parameters_ptr params;
    Persistent<Function> cb;
    std::string error;
};

/**
 * Computes a route between coordinates over the network.
 *
 * @name osrm.route
 * 
 * @param {Object} options Object literal containing parameters for the route query.
 * @param {Array<Array<Number>>} options.coordinates Via points to route represented by an array of number arrays expressing coordinate pairs as latitude, longitude.
 * @param {Boolean} [options.alternateRoute=false] Return an alternate route.
 * @param {Number} [options.checksum] [Checksum](https://en.wikipedia.org/wiki/Checksum) of the network dataset.
 * @param {Number} [options.zoomLevel=18] Determines the level of generalization. The default zoom 18 performs no generalization.
 * @param {Boolean} [options.printInstructions=false] Include turn by turn instructions.
 * @param {Boolean} [options.geometry=true] Include the geometry of the route.
 * @param {Array<String>} [options.hints] [Polylines](https://github.com/mapbox/polyline) that can be used to speed up incremental queries, where only a few via nodes change.
 * 
 * @returns {RouteResult} matchings array containing an object for each partial sub-matching of the trace.
 *
 * @example
 * var osrm = new OSRM("berlin-latest.osrm");
 * osrm.route({coordinates: [[52.519930,13.438640], [52.513191,13.415852]]}, function(err, route) {
 *     if(err) throw err;
 * });
 * 
 */

/**
 * @name RouteResult
 * @typedef {Object} RouteResult
 * @property {Number} status 0 if passed, undefined if failed.
 * @property {String} status_message Information about the query results.
 * @property {Array<Number>} via_indices Array of node indices corresponding to the via coordinates.
 * @property {String} route_geometry Geometry of the suggested route, compressed as a [polyline](https://github.com/mapbox/polyline).
 * @property {Object} route_summary Object literal containing an overview of the suggested route.
 * @property {String} route_summary.start_point Human readable name of the start location.
 * @property {String} route_summary.end_point Human readable name of the end location.
 * @property {Number} route_summary.total_time Total time of the trip in seconds.
 * @property {Number} route_summary.total_distance Total distance of the trip in meters.
 * @property {Array<Array<Number>>} via_points Array of latitude, longitude Array pairs representing the routed points.
 * @property {Boolean} found_alternative Value will be `true` if an alternitive route was requested and found. Set options.alternateRoute to `true` to attempt to find an alternate route.
 * @property {Array<String>} route_name An array of the most prominent street names along the route.
 * @property {Object} hint_data Object literal containing necessary data for speeding up similar queries.
 * @property {Array<String>} hint_data.locations An array of [polyline](https://github.com/mapbox/polyline) strings used for incremental hinting.
 * @property {Number} hint_data.checksum [Checksum](https://en.wikipedia.org/wiki/Checksum) of the network dataset.
 */
NAN_METHOD(Engine::route)
{
    NanScope();

    if (args.Length() < 2) {
        NanThrowTypeError("two arguments required");
        NanReturnUndefined();
    }

    if (!args[0]->IsObject()) {
        NanThrowTypeError("first arg must be an object");
        NanReturnUndefined();
    }

    Local<Object> obj = args[0]->ToObject();

    route_parameters_ptr params = make_unique<RouteParameters>();

    params->zoom_level = 18; //no generalization
    params->print_instructions = false; //turn by turn instructions
    params->alternate_route = true; //get an alternate route, too
    params->geometry = true; //retrieve geometry of route
    params->compression = true; //polyline encoding
    params->check_sum = 0; //see wiki
    params->service = "viaroute"; //that's routing
    params->output_format = "json";
    params->jsonp_parameter = ""; //set for jsonp wrapping
    params->language = ""; //unused atm

    if (!obj->Has(NanNew("coordinates"))) {
        NanThrowError("must provide a coordinates property");
        NanReturnUndefined();
    }

    Local<Value> coordinates = obj->Get(NanNew("coordinates"));
    if (!coordinates->IsArray()) {
        NanThrowError("coordinates must be an array of (lat/long) pairs");
        NanReturnUndefined();
    }

    Local<Array> coordinates_array = Local<Array>::Cast(coordinates);
    if (coordinates_array->Length() < 2) {
        NanThrowError("at least two coordinates must be provided");
        NanReturnUndefined();
    }

    for (uint32_t i = 0; i < coordinates_array->Length(); ++i) {
        Local<Value> coordinate = coordinates_array->Get(i);

        if (!coordinate->IsArray()) {
            NanThrowError("coordinates must be an array of (lat/long) pairs");
            NanReturnUndefined();
        }

        Local<Array> coordinate_pair = Local<Array>::Cast(coordinate);
        if (coordinate_pair->Length() != 2) {
            NanThrowError("coordinates must be an array of (lat/long) pairs");
            NanReturnUndefined();
        }

        params->coordinates.emplace_back(static_cast<int>(coordinate_pair->Get(0)->NumberValue()*COORDINATE_PRECISION),
                                         static_cast<int>(coordinate_pair->Get(1)->NumberValue()*COORDINATE_PRECISION));
    }

    if (obj->Has(NanNew("alternateRoute"))) {
        params->alternate_route = obj->Get(NanNew("alternateRoute"))->BooleanValue();
    }

    if (obj->Has(NanNew("checksum"))) {
        params->check_sum = static_cast<unsigned>(obj->Get(NanNew("checksum"))->Uint32Value());
    }

    if (obj->Has(NanNew("zoomLevel"))) {
        params->zoom_level = static_cast<short>(obj->Get(NanNew("zoomLevel"))->Int32Value());
    }

    if (obj->Has(NanNew("printInstructions"))) {
        params->print_instructions = obj->Get(NanNew("printInstructions"))->BooleanValue();
    }

    if (obj->Has(NanNew("geometry"))) {
        params->geometry = obj->Get(NanNew("geometry"))->BooleanValue();
    }

    if (obj->Has(NanNew("jsonpParameter"))) {
        params->jsonp_parameter = *v8::String::Utf8Value(obj->Get(NanNew("jsonpParameter")));
    }

    if (obj->Has(NanNew("hints"))) {
        Local<Value> hints = obj->Get(NanNew("hints"));

        if (!hints->IsArray()) {
            NanThrowError("hints must be an array of strings/null");
            NanReturnUndefined();
        }

        Local<Array> hints_array = Local<Array>::Cast(hints);
        for (uint32_t i = 0; i < hints_array->Length(); ++i) {
            Local<Value> hint = hints_array->Get(i);
            if (hint->IsString()) {
                params->hints.push_back(*v8::String::Utf8Value(hint));
            } else if(hint->IsNull()){
                params->hints.push_back("");
            }else{
                NanThrowError("hint must be null or string");
                NanReturnUndefined();
            }
        }
    }

    Run(args, std::move(params));
    NanReturnUndefined();
}

/**
 * Returns coordinate snapped to nearest node
 *
 * @name osrm.locate
 * 
 * @param {Array<Number>} point Latitude, longitude pair to locate on the network.
 * 
 * @returns {Array<Number>} node Location of the nearest node as a latitude, longitude pair.
 *
 * @example
 * var osrm = new OSRM('berlin-latest.osrm');
 * osrm.locate([52.4224, 13.333086], function(err, result) {
 *     if(err) throw err;
 * });
 */
NAN_METHOD(Engine::locate)
{
    NanScope();
    if (args.Length() < 2) {
        NanThrowTypeError("two arguments required");
        NanReturnUndefined();
    }

    Local<Value> coordinate = args[0];
    if (!coordinate->IsArray()) {
        NanThrowError("first argument must be an array of lat, long");
        NanReturnUndefined();
    }

    Local<Array> coordinate_pair = Local<Array>::Cast(coordinate);
    if (coordinate_pair->Length() != 2) {
        NanThrowError("first argument must be an array of lat, long");
        NanReturnUndefined();
    }

    route_parameters_ptr params = make_unique<RouteParameters>();

    params->service = "locate";
    params->coordinates.emplace_back(static_cast<int>(coordinate_pair->Get(0)->NumberValue()*COORDINATE_PRECISION),
                                     static_cast<int>(coordinate_pair->Get(1)->NumberValue()*COORDINATE_PRECISION));

    Run(args, std::move(params));
    NanReturnUndefined();
}

/**
 * Matches given coordinates to the road network
 *
 * @name osrm.match
 * 
 * @param {Array<Array<Number>>} coordinates The point to match as a latitude, longitude array.
 * @param {Array<Number>} timestamps An array of UNIX style timestamps corresponding to the input coordinates (eg: 1424684612).
 * @param {Boolean} [classify=false] Return a confidence value for this matching.
 * @param {Number} [gps_precision=-1] Specify gps precision as standart deviation in meters.
 * @param {Number} [matching_beta=-1] Specify beta value for matching algorithm.
 * 
 * @returns {Array<MatchResult>} matchings Array of MatchResults, each containing an object for a partial sub-matching of the trace.
 *
 * @example
 * var osrm = new OSRM('berlin-latest.osrm');
 * var options = {
 *     coordinates: [[52.542648,13.393252], [52.543079,13.394780], [52.542107,13.397389]],
 *     timestamps: [1424684612, 1424684616, 1424684620]
 * };
 * osrm.match(options, function(err, response) {
 *     if(err) throw err;
 * });
 * 
 */

/**
 * @name MatchResult
 * @typedef {Object} MatchResult
 * @property {Array<Array<Number>>} matched_points Coordinates the points snapped to the road network as latitude, longitude pairs.
 * @property {Array<Number>} indices Array that gives the indices of the matched coordinates in the original trace.
 * @property {String} geometry Geometry of the matched trace in the road network, compressed as a [polyline](https://github.com/mapbox/polyline) with 6 decimals of precision.
 * @property {Number} confidence Value between 0 and 1, where 1 is very confident. Please note that the correctness of this value depends highly on [the assumptions about the sample rate](https://github.com/Project-OSRM/osrm-backend/wiki/Server-api#service-match).
 */
NAN_METHOD(Engine::match)
{
    NanScope();
    if (args.Length() < 2) {
        NanThrowTypeError("two arguments required");
        NanReturnUndefined();
    }

    if (args[0]->IsNull() || args[0]->IsUndefined()) {
        NanThrowError("first arg must be an object");
        NanReturnUndefined();
    }
    Local<Object> obj = args[0]->ToObject();

    Local<Value> coordinates = obj->Get(NanNew("coordinates"));
    if (!coordinates->IsArray()) {
        NanThrowError("coordinates must be an array of (lat/long) pairs");
        NanReturnUndefined();
    }

    Local<Array> coordinates_array = Local<Array>::Cast(coordinates);
    if (coordinates_array->Length() < 2) {
        NanThrowError("at least two coordinates must be provided");
        NanReturnUndefined();
    }

    Local<Value> timestamps = obj->Get(NanNew("timestamps"));
    if (!timestamps->IsArray() && !timestamps->IsUndefined()) {
        NanThrowError("timestamps must be an array of integers (or undefined)");
        NanReturnUndefined();
    }

    route_parameters_ptr params = make_unique<RouteParameters>();
    params->service = "match";

    if (obj->Has(NanNew("classify"))) {
        params->classify = obj->Get(NanNew("classify"))->BooleanValue();
    }
    if (obj->Has(NanNew("gps_precision"))) {
        params->gps_precision = obj->Get(NanNew("gps_precision"))->NumberValue();
    }
    if (obj->Has(NanNew("matching_beta"))) {
        params->matching_beta = obj->Get(NanNew("matching_beta"))->NumberValue();
    }
    if (obj->Has(NanNew("compression"))) {
        params->compression = obj->Get(NanNew("compression"))->BooleanValue();
    }

    if (timestamps->IsArray()) {
        Local<Array> timestamps_array = Local<Array>::Cast(timestamps);
        if (coordinates_array->Length() != timestamps_array->Length()) {
            NanThrowError("timestamp array must have the same size as the coordinates array");
            NanReturnUndefined();
        }

        // add all timestamps
        for (uint32_t i = 0; i < timestamps_array->Length(); ++i) {
            if (!timestamps_array->Get(i)->IsNumber()) {
                NanThrowError("timestamps array items must be numbers");
                NanReturnUndefined();
            }
            params->timestamps.emplace_back(static_cast<unsigned>(timestamps_array->Get(i)->NumberValue()));
        }
    }

    // add all coordinates
    for (uint32_t i = 0; i < coordinates_array->Length(); ++i) {
        Local<Value> coordinate = coordinates_array->Get(i);

        if (!coordinate->IsArray()) {
            NanThrowError("coordinates must be an array of (lat/long) pairs");
            NanReturnUndefined();
        }

        Local<Array> coordinate_pair = Local<Array>::Cast(coordinate);
        if (coordinate_pair->Length() != 2) {
            NanThrowError("coordinates must be an array of (lat/long) pairs");
            NanReturnUndefined();
        }

        params->coordinates.emplace_back(static_cast<int>(coordinate_pair->Get(0)->NumberValue()*COORDINATE_PRECISION),
                                         static_cast<int>(coordinate_pair->Get(1)->NumberValue()*COORDINATE_PRECISION));

    }

    Run(args, std::move(params));
    NanReturnUndefined();
}

// uses the same options as viaroute
NAN_METHOD(Engine::trip)
{
    NanScope();

    if (args.Length() < 2) {
        NanThrowTypeError("two arguments required");
        NanReturnUndefined();
    }

    if (!args[0]->IsObject()) {
        NanThrowTypeError("first arg must be an object");
        NanReturnUndefined();
    }

    Local<Object> obj = args[0]->ToObject();

    route_parameters_ptr params = make_unique<RouteParameters>();

    params->zoom_level = 18; //no generalization
    params->print_instructions = false; //turn by turn instructions
    params->alternate_route = false; //get an alternate route, too
    params->geometry = true; //retrieve geometry of route
    params->compression = true; //polyline encoding
    params->check_sum = 0; //see wiki
    params->service = "trip"; //that's routing
    params->output_format = "json";
    params->jsonp_parameter = ""; //set for jsonp wrapping
    params->language = ""; //unused atm

    if (!obj->Has(NanNew("coordinates"))) {
        NanThrowError("must provide a coordinates property");
        NanReturnUndefined();
    }

    Local<Value> coordinates = obj->Get(NanNew("coordinates"));
    if (!coordinates->IsArray()) {
        NanThrowError("coordinates must be an array of (lat/long) pairs");
        NanReturnUndefined();
    }

    Local<Array> coordinates_array = Local<Array>::Cast(coordinates);
    if (coordinates_array->Length() < 2) {
        NanThrowError("at least two coordinates must be provided");
        NanReturnUndefined();
    }

    for (uint32_t i = 0; i < coordinates_array->Length(); ++i) {
        Local<Value> coordinate = coordinates_array->Get(i);

        if (!coordinate->IsArray()) {
            NanThrowError("coordinates must be an array of (lat/long) pairs");
            NanReturnUndefined();
        }

        Local<Array> coordinate_pair = Local<Array>::Cast(coordinate);
        if (coordinate_pair->Length() != 2) {
            NanThrowError("coordinates must be an array of (lat/long) pairs");
            NanReturnUndefined();
        }

        params->coordinates.emplace_back(static_cast<int>(coordinate_pair->Get(0)->NumberValue()*COORDINATE_PRECISION),
                                         static_cast<int>(coordinate_pair->Get(1)->NumberValue()*COORDINATE_PRECISION));
    }

    if (obj->Has(NanNew("alternateRoute"))) {
        params->alternate_route = obj->Get(NanNew("alternateRoute"))->BooleanValue();
    }

    if (obj->Has(NanNew("checksum"))) {
        params->check_sum = static_cast<unsigned>(obj->Get(NanNew("checksum"))->Uint32Value());
    }

    if (obj->Has(NanNew("zoomLevel"))) {
        params->zoom_level = static_cast<short>(obj->Get(NanNew("zoomLevel"))->Int32Value());
    }

    if (obj->Has(NanNew("printInstructions"))) {
        params->print_instructions = obj->Get(NanNew("printInstructions"))->BooleanValue();
    }

    if (obj->Has(NanNew("geometry"))) {
        params->geometry = obj->Get(NanNew("geometry"))->BooleanValue();
    }

    if (obj->Has(NanNew("jsonpParameter"))) {
        params->jsonp_parameter = *v8::String::Utf8Value(obj->Get(NanNew("jsonpParameter")));
    }

    if (obj->Has(NanNew("hints"))) {
        Local<Value> hints = obj->Get(NanNew("hints"));

        if (!hints->IsArray()) {
            NanThrowError("hints must be an array of strings/null");
            NanReturnUndefined();
        }

        Local<Array> hints_array = Local<Array>::Cast(hints);
        for (uint32_t i = 0; i < hints_array->Length(); ++i) {
            Local<Value> hint = hints_array->Get(i);
            if (hint->IsString()) {
                params->hints.push_back(*v8::String::Utf8Value(hint));
            } else if(hint->IsNull()){
                params->hints.push_back("");
            }else{
                NanThrowError("hint must be null or string");
                NanReturnUndefined();
            }
        }
    }

    Run(args, std::move(params));
    NanReturnUndefined();
}

/**
 * Computes distance tables for the given via points. Currently all pair-wise distances are computed. Please note that the distance in this case is the travel time which is the default metric used by OSRM.
 *
 * @name osrm.table
 * 
 * @param {Array<Array<Number>>} coordinates Array of coordinate pairs as latitude, longitude representing the via points to be computed.
 * 
 * @returns {TableResult}
 *
 * @example
 * var osrm = new OSRM("berlin-latest.osrm");
 * var options = {
 *     coordinates: [[52.519930,13.438640], [52.513191,13.415852]]
 * };   
 * osrm.table(options, function(err, table) {
 *     if(err) throw err
 * });
 * 
 */

/**
 * @name TableResult
 * @typedef {Object} TableResult 
 * @property {Array<Array<Number>>} distance_table Array of arrays that stores the matrix in [row-major order](https://en.wikipedia.org/wiki/Row-major_order). `distance_table[i][j]` gives the travel time from the i-th via to the j-th via point. Values are given in 10th of a second.
 */
NAN_METHOD(Engine::table)
{
    NanScope();
    if (args.Length() < 2) {
        NanThrowTypeError("two arguments required");
        NanReturnUndefined();
    }

    if (args[0]->IsNull() || args[0]->IsUndefined()) {
        NanThrowError("first arg must be an object");
        NanReturnUndefined();
    }
    Local<Object> obj = args[0]->ToObject();

    Local<Value> coordinates = obj->Get(NanNew("coordinates"));
    if (!coordinates->IsArray()) {
        NanThrowError("coordinates must be an array of (lat/long) pairs");
        NanReturnUndefined();
    }

    Local<Array> coordinates_array = Local<Array>::Cast(coordinates);
    if (coordinates_array->Length() < 2) {
        NanThrowError("at least two coordinates must be provided");
        NanReturnUndefined();
    }

    route_parameters_ptr params = make_unique<RouteParameters>();
    params->service = "table";

    // add all coordinates
    for (uint32_t i = 0; i < coordinates_array->Length(); ++i) {
        Local<Value> coordinate = coordinates_array->Get(i);

        if (!coordinate->IsArray()) {
            NanThrowError("coordinates must be an array of (lat/long) pairs");
            NanReturnUndefined();
        }

        Local<Array> coordinate_pair = Local<Array>::Cast(coordinate);
        if (coordinate_pair->Length() != 2) {
            NanThrowError("coordinates must be an array of (lat/long) pairs");
            NanReturnUndefined();
        }

        params->coordinates.emplace_back(static_cast<int>(coordinate_pair->Get(0)->NumberValue()*COORDINATE_PRECISION),
                                         static_cast<int>(coordinate_pair->Get(1)->NumberValue()*COORDINATE_PRECISION));
    }

    Run(args, std::move(params));
    NanReturnUndefined();
}

/**
 * Computes the nearest street segment for a given coordinate.
 *
 * @name osrm.nearest
 * 
 * @param {Array<Number>} point coordinates of the query point as a latitude, longitude array
 * 
 * @returns NearestResult
 *
 * @example
 * var osrm = new OSRM('berlin-latest.osrm');
 * osrm.nearest([52.4224, 13.333086], function(err, result) {
 *     if(err) throw err;
 * });
 * 
 */

/**
 * @name NearestResult
 * @typedef {Object} NearestResult
 * @property {Number} status 0 if passed, undefined if failed.
 * @property {Array<Number>} mapped_coordinate Array that contains the latitude, longitude pair for the snapped coordinate.
 * @property {String} name Name of the street the coordinate snapped to.
 */
NAN_METHOD(Engine::nearest)
{
    NanScope();
    if (args.Length() < 2) {
        NanThrowTypeError("two arguments required");
        NanReturnUndefined();
    }

    Local<Value> coordinate = args[0];
    if (!coordinate->IsArray()) {
        NanThrowError("first argument must be an array of lat, long");
        NanReturnUndefined();
    }

    Local<Array> coordinate_pair = Local<Array>::Cast(coordinate);
    if (coordinate_pair->Length() != 2) {
        NanThrowError("first argument must be an array of lat, long");
        NanReturnUndefined();
    }

    route_parameters_ptr params = make_unique<RouteParameters>();

    params->service = "nearest";
    params->coordinates.emplace_back(static_cast<int>(coordinate_pair->Get(0)->NumberValue()*COORDINATE_PRECISION),
                                     static_cast<int>(coordinate_pair->Get(1)->NumberValue()*COORDINATE_PRECISION));
    Run(args, std::move(params));
    NanReturnUndefined();
}

void Engine::Run(_NAN_METHOD_ARGS, route_parameters_ptr params)
{
    NanScope();
    Local<Value> callback = args[args.Length()-1];

    if (!callback->IsFunction()) {
        NanThrowTypeError("last argument must be a callback function");
        return;
    }

    auto closure = new RunQueryBaton();
    closure->request.data = closure;
    closure->machine = ObjectWrap::Unwrap<Engine>(args.This());
    closure->params = std::move(params);
    closure->error = "";
    NanAssignPersistent(closure->cb, callback.As<Function>());
    uv_queue_work(uv_default_loop(), &closure->request, AsyncRun, reinterpret_cast<uv_after_work_cb>(AfterRun));
    closure->machine->Ref();
    return;
}

void Engine::AsyncRun(uv_work_t* req) {
    RunQueryBaton *closure = static_cast<RunQueryBaton *>(req->data);
    try {
        closure->machine->this_->RunQuery(*closure->params, closure->result);
    } catch(std::exception const& ex) {
        closure->error = ex.what();
    }
}

void Engine::AfterRun(uv_work_t* req) {
    NanScope();
    RunQueryBaton *closure = static_cast<RunQueryBaton *>(req->data);
    TryCatch try_catch;
    if (closure->error.size() > 0) {
        Local<Value> argv[1] = { NanError(closure->error.c_str()) };
        NanMakeCallback(NanGetCurrentContext()->Global(), NanNew(closure->cb), 1, argv);
    } else {
        Local<Value> result;
        osrm::json::render(result, closure->result);
        Local<Value> argv[2] = { NanNull(), result };
        NanMakeCallback(NanGetCurrentContext()->Global(), NanNew(closure->cb), 2, argv);
    }
    if (try_catch.HasCaught()) {
        node::FatalException(try_catch);
    }
    closure->machine->Unref();
    NanDisposePersistent(closure->cb);
    delete closure;
}

extern "C" {
    static void start(Handle<Object> target) {
        Engine::Initialize(target);
    }
}

} // namespace node_osrm

NODE_MODULE(osrm, node_osrm::start)
