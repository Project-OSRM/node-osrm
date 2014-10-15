// v8
#include <v8.h>

// node
#include <node.h>
#include <node_version.h>
#include <node_object_wrap.h>

// OSRM
#include <osrm/OSRM.h>
#include <osrm/RouteParameters.h>
#include <osrm/Reply.h>
#include <osrm/ServerPaths.h>

// STL
#include <memory>

namespace node_osrm {

using namespace v8;

typedef std::unique_ptr<OSRM> osrm_ptr;
typedef std::shared_ptr<ServerPaths> server_paths_ptr;
typedef std::shared_ptr<RouteParameters> route_parameters_ptr;

namespace {
template <class T, class... Types>
std::unique_ptr<T> make_unique(Types &&... Args)
{
    return (std::unique_ptr<T>(new T(std::forward<Types>(Args)...)));
}
}

class Engine: public node::ObjectWrap {
public:
    static Persistent<FunctionTemplate> constructor;
    static void Initialize(Handle<Object>);
    static Handle<Value> New(const Arguments&);

    static Handle<Value> route(const Arguments&);
    static Handle<Value> locate(const Arguments&);
    static Handle<Value> nearest(const Arguments&);
    static Handle<Value> table(const Arguments&);

    static Handle<Value> Run(const Arguments&, route_parameters_ptr);
    static void AsyncRun(uv_work_t*);
    static void AfterRun(uv_work_t*);

    Engine(server_paths_ptr paths, bool use_shared_memory)
        : ObjectWrap(),
          paths_(paths),
          this_(make_unique<OSRM>(*paths, use_shared_memory))
    {}

    ~Engine() {}

    server_paths_ptr paths_;
    osrm_ptr this_;
};

Persistent<FunctionTemplate> Engine::constructor;

void Engine::Initialize(Handle<Object> target) {
    HandleScope scope;

    constructor = Persistent<FunctionTemplate>::New(FunctionTemplate::New(Engine::New));
    constructor->InstanceTemplate()->SetInternalFieldCount(1);
    constructor->SetClassName(String::NewSymbol("OSRM"));

    NODE_SET_PROTOTYPE_METHOD(constructor, "route", route);
    NODE_SET_PROTOTYPE_METHOD(constructor, "locate", locate);
    NODE_SET_PROTOTYPE_METHOD(constructor, "nearest", nearest);
    NODE_SET_PROTOTYPE_METHOD(constructor, "table", table);

    target->Set(String::NewSymbol("OSRM"), constructor->GetFunction());
}

Handle<Value> Engine::New(const Arguments& args)
{
    HandleScope scope;

    if (!args.IsConstructCall()) {
        return ThrowException(Exception::Error(String::New(
            "Cannot call constructor as function, you need to use 'new' keyword")));
    }

    try {
        server_paths_ptr paths = std::make_shared<ServerPaths>();

        if (args.Length() == 1) {
            if (!args[0]->IsString()) {
                return ThrowException(Exception::TypeError(String::New("OSRM base path must be a string")));
            }
            std::string base = *String::Utf8Value(args[0]->ToString());
            (*paths)["base"] = base;
        }

        Engine* im = new Engine(paths, args.Length() == 0);
        im->Wrap(args.This());
        return args.This();
    } catch (std::exception const& ex) {
        return ThrowException(Exception::Error(String::New(ex.what())));
    }

    return Undefined();
}

typedef struct {
    uv_work_t request;
    Engine * machine;
    route_parameters_ptr params;
    bool error;
    std::string result;
    Persistent<Function> cb;
} run_query_baton_t;

Handle<Value> Engine::route(const Arguments& args)
{
    HandleScope scope;

    if (args.Length() < 2) {
        return ThrowException(Exception::TypeError(
            String::New("two arguments required")));
    }

    if (!args[0]->IsObject()) {
        return ThrowException(Exception::TypeError(
            String::New("first argument must be an object")));
    }

    Local<Object> obj = args[0]->ToObject();
    if (obj->IsNull() || obj->IsUndefined()) {
        return ThrowException(Exception::TypeError(String::New(
            "first arg must be an object")));
    }

    route_parameters_ptr params = std::make_shared<RouteParameters>();

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

    if (!obj->Has(String::New("coordinates"))) {
        return ThrowException(Exception::TypeError(String::New(
            "must provide a coordinates property")));
    }

    Local<Value> coordinates = obj->Get(String::New("coordinates"));
    if (!coordinates->IsArray()) {
        return ThrowException(Exception::TypeError(String::New(
            "coordinates must be an array of (lat/long) pairs")));
    }

    Local<Array> coordinates_array = Local<Array>::Cast(coordinates);
    if (coordinates_array->Length() < 2) {
        return ThrowException(Exception::TypeError(String::New(
            "at least two coordinates must be provided")));
    }

    for (uint32_t i = 0; i < coordinates_array->Length(); ++i) {
        Local<Value> coordinate = coordinates_array->Get(i);

        if (!coordinate->IsArray()) {
            return ThrowException(Exception::TypeError(String::New("coordinates must be an array of (lat/long) pairs")));
        }

        Local<Array> coordinate_pair = Local<Array>::Cast(coordinate);
        if (coordinate_pair->Length() != 2) {
            return ThrowException(Exception::TypeError(String::New("coordinates must be an array of (lat/long) pairs")));
        }

        params->coordinates.push_back(
            FixedPointCoordinate(coordinate_pair->Get(0)->NumberValue()*COORDINATE_PRECISION,
                                 coordinate_pair->Get(1)->NumberValue()*COORDINATE_PRECISION));
    }

    if (obj->Has(String::New("alternateRoute"))) {
        params->alternate_route = obj->Get(String::New("alternateRoute"))->BooleanValue();
    }

    if (obj->Has(String::New("checksum"))) {
        params->check_sum = static_cast<unsigned>(obj->Get(String::New("checksum"))->Uint32Value());
    }

    if (obj->Has(String::New("zoomLevel"))) {
        params->zoom_level = static_cast<short>(obj->Get(String::New("zoomLevel"))->Int32Value());
    }

    if (obj->Has(String::New("printInstructions"))) {
        params->print_instructions = obj->Get(String::New("printInstructions"))->BooleanValue();
    }

    if (obj->Has(String::New("jsonpParameter"))) {
        params->jsonp_parameter = *v8::String::Utf8Value(obj->Get(String::New("jsonpParameter")));
    }

    if (obj->Has(String::New("hints"))) {
        Local<Value> hints = obj->Get(String::New("hints"));

        if (!hints->IsArray()) {
            return ThrowException(Exception::TypeError(String::New("hints must be an array of strings/null")));
        }

        Local<Array> hints_array = Local<Array>::Cast(hints);
        for (uint32_t i = 0; i < hints_array->Length(); ++i) {
            Local<Value> hint = hints_array->Get(i);
            if (hint->IsString()) {
                params->hints.push_back(*v8::String::Utf8Value(hint));
            } else if(hint->IsNull()){
                params->hints.push_back("");
            }else{
                return ThrowException(Exception::TypeError(String::New("hint must be null or string")));
            }
        }
    }

    return Run(args, params);
}

Handle<Value> Engine::locate(const Arguments& args)
{
    if (args.Length() < 2) {
        return ThrowException(Exception::TypeError(
            String::New("two arguments required")));
    }

    Local<Value> coordinate = args[0];
    if (!coordinate->IsArray()) {
        return ThrowException(Exception::TypeError(String::New(
            "first argument must be an array of lat, long")));
    }

    Local<Array> coordinate_pair = Local<Array>::Cast(coordinate);
    if (coordinate_pair->Length() != 2) {
        return ThrowException(Exception::TypeError(String::New(
            "first argument must be an array of lat, long")));
    }

    route_parameters_ptr params = std::make_shared<RouteParameters>();

    params->service = "locate";
    params->coordinates.push_back(
        FixedPointCoordinate(coordinate_pair->Get(0)->NumberValue()*COORDINATE_PRECISION,
                             coordinate_pair->Get(1)->NumberValue()*COORDINATE_PRECISION));

    return Run(args, params);
}

Handle<Value> Engine::table(const Arguments& args)
{
    if (args.Length() < 2) {
        return ThrowException(Exception::TypeError(
            String::New("two arguments required")));
    }

    Local<Object> obj = args[0]->ToObject();
    if (obj->IsNull() || obj->IsUndefined()) {
        return ThrowException(Exception::TypeError(String::New(
            "first arg must be an object")));
    }

    Local<Value> coordinates = obj->Get(String::New("coordinates"));
    if (!coordinates->IsArray()) {
        return ThrowException(Exception::TypeError(String::New(
            "coordinates must be an array of (lat/long) pairs")));
    }

    Local<Array> coordinates_array = Local<Array>::Cast(coordinates);
    if (coordinates_array->Length() < 2) {
        return ThrowException(Exception::TypeError(String::New(
            "at least two coordinates must be provided")));
    }

    route_parameters_ptr params = std::make_shared<RouteParameters>();
    params->service = "table";

    // add all coordinates
    for (uint32_t i = 0; i < coordinates_array->Length(); ++i) {
        Local<Value> coordinate = coordinates_array->Get(i);

        if (!coordinate->IsArray()) {
            return ThrowException(Exception::TypeError(String::New("coordinates must be an array of (lat/long) pairs")));
        }

        Local<Array> coordinate_pair = Local<Array>::Cast(coordinate);
        if (coordinate_pair->Length() != 2) {
            return ThrowException(Exception::TypeError(String::New("coordinates must be an array of (lat/long) pairs")));
        }

        params->coordinates.push_back(
            FixedPointCoordinate(coordinate_pair->Get(0)->NumberValue()*COORDINATE_PRECISION,
                                 coordinate_pair->Get(1)->NumberValue()*COORDINATE_PRECISION));
    }

    return Run(args, params);
}

Handle<Value> Engine::nearest(const Arguments& args)
{
    if (args.Length() < 2) {
        return ThrowException(Exception::TypeError(
            String::New("two arguments required")));
    }

    Local<Value> coordinate = args[0];
    if (!coordinate->IsArray()) {
        return ThrowException(Exception::TypeError(String::New(
            "first argument must be an array of lat, long")));
    }

    Local<Array> coordinate_pair = Local<Array>::Cast(coordinate);
    if (coordinate_pair->Length() != 2) {
        return ThrowException(Exception::TypeError(String::New(
            "first argument must be an array of lat, long")));
    }

    route_parameters_ptr params = std::make_shared<RouteParameters>();

    params->service = "nearest";
    params->coordinates.push_back(
        FixedPointCoordinate(coordinate_pair->Get(0)->NumberValue()*COORDINATE_PRECISION,
                             coordinate_pair->Get(1)->NumberValue()*COORDINATE_PRECISION));

    return Run(args, params);
}

Handle<Value> Engine::Run(const Arguments& args, route_parameters_ptr params)
{
    if (!args[1]->IsFunction()) {
        return ThrowException(Exception::TypeError(String::New(
            "second argument must be a callback function")));
    }

    run_query_baton_t *closure = new run_query_baton_t();
    closure->request.data = closure;
    closure->machine = ObjectWrap::Unwrap<Engine>(args.This());
    closure->params = params;
    closure->error = false;
    closure->cb = Persistent<Function>::New(Handle<Function>::Cast(args[1]));

    uv_queue_work(uv_default_loop(), &closure->request, AsyncRun, (uv_after_work_cb)AfterRun);
    closure->machine->Ref();

    return Undefined();
}

void Engine::AsyncRun(uv_work_t* req) {
    run_query_baton_t *closure = static_cast<run_query_baton_t *>(req->data);
    try {
        http::Reply osrm_reply;
        closure->machine->this_->RunQuery(*closure->params, osrm_reply);
        closure->result = std::string(osrm_reply.content.begin(), osrm_reply.content.end());
    } catch(std::exception const& ex) {
        closure->error = true;
        closure->result = ex.what();
    }
}

void Engine::AfterRun(uv_work_t* req) {
    HandleScope scope;
    run_query_baton_t *closure = static_cast<run_query_baton_t *>(req->data);
    TryCatch try_catch;
    if (closure->error) {
        Local<Value> argv[1] = { Exception::Error(String::New(closure->result.c_str())) };
        closure->cb->Call(Context::GetCurrent()->Global(), 1, argv);
    } else {
        Local<Value> argv[2] = { Local<Value>::New(Null()),
                                 String::New(closure->result.c_str()) };
        closure->cb->Call(Context::GetCurrent()->Global(), 2, argv);
    }
    if (try_catch.HasCaught()) {
        node::FatalException(try_catch);
    }
    closure->machine->Unref();
    closure->cb.Dispose();
    delete closure;
}

extern "C" {
    static void start(Handle<Object> target) {
        Engine::Initialize(target);
    }
}

} // namespace node_osrm

NODE_MODULE(osrm, node_osrm::start)
