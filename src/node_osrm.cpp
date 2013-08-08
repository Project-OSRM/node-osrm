// v8
#include <v8.h>

// node
#include <node.h>
#include <node_version.h>
#include <node_object_wrap.h>

// osrm
#include <OSRM.h>

namespace node_osrm {

using namespace v8;

// interfaces

typedef boost::shared_ptr<RouteParameters> route_parameters_ptr;

class Query: public node::ObjectWrap {
public:
    static Persistent<FunctionTemplate> constructor;
    static void Initialize(Handle<Object> target);
    static Handle<Value> New(Arguments const& args);
    Query();
    inline route_parameters_ptr get() { return this_; }
    void _ref() { Ref(); }
    void _unref() { Unref(); }
private:
    ~Query();
    route_parameters_ptr this_;
};

typedef boost::shared_ptr<OSRM> osrm_ptr;

class Engine: public node::ObjectWrap {
public:
    static Persistent<FunctionTemplate> constructor;
    static void Initialize(Handle<Object> target);
    static Handle<Value> New(Arguments const& args);
    static Handle<Value> run(Arguments const& args);
    static Handle<Value> runSync(Arguments const& args);
    static void AsyncRun(uv_work_t* req);
    static void AfterRun(uv_work_t* req);
    Engine(std::string const& config_path);
    inline osrm_ptr get() { return this_; }
    void _ref() { Ref(); }
    void _unref() { Unref(); }
private:
    ~Engine();
    osrm_ptr this_;
};


// implementations

Persistent<FunctionTemplate> Engine::constructor;
Persistent<FunctionTemplate> Query::constructor;

void Query::Initialize(Handle<Object> target) {
    HandleScope scope;
    constructor = Persistent<FunctionTemplate>::New(FunctionTemplate::New(Query::New));
    constructor->InstanceTemplate()->SetInternalFieldCount(1);
    constructor->SetClassName(String::NewSymbol("Query"));
    target->Set(String::NewSymbol("Query"),constructor->GetFunction());
}

Query::Query()
  : ObjectWrap(),
    this_(boost::make_shared<RouteParameters>()) { }

Query::~Query() { }

Handle<Value> Query::New(Arguments const& args)
{
    HandleScope scope;
    if (!args.IsConstructCall()) {
        return ThrowException(Exception::Error(String::New("Cannot call constructor as function, you need to use 'new' keyword")));
    }
    try {
        if (args.Length() == 1) {
            if (!args[0]->IsObject()) {
                return ThrowException(Exception::TypeError(String::New("first argument must be an object")));
            }
            Local<Object> obj = args[0]->ToObject();
            if (obj->IsNull() || obj->IsUndefined()) {
                return ThrowException(Exception::TypeError(String::New("first arg must be an object")));
            }
            if (!obj->Has(String::NewSymbol("start")) || !obj->Has(String::NewSymbol("end"))) {
                return ThrowException(Exception::TypeError(String::New("must provide a start and end (lat/long) coordinate pair")));
            }
            Local<Value> start = obj->Get(String::New("start"));
            Local<Value> end = obj->Get(String::New("end"));
            if (!start->IsArray() || !end->IsArray()) {
                return ThrowException(Exception::TypeError(String::New("start and end must be an array of (lat/long) coordinate pairs")));
            }
            Local<Array> start_array = Local<Array>::Cast(start);
            Local<Array> end_array = Local<Array>::Cast(end);
            if (start_array->Length() != 2 || end_array->Length() != 2) {
                return ThrowException(Exception::TypeError(String::New("start and end must be an array of 2 (lat/long) coordinates")));
            }
            _Coordinate start_coordinate(start_array->Get(0)->NumberValue()*COORDINATE_PRECISION,
                                         start_array->Get(1)->NumberValue()*COORDINATE_PRECISION);
            _Coordinate end_coordinate(end_array->Get(0)->NumberValue()*COORDINATE_PRECISION,
                                       end_array->Get(1)->NumberValue()*COORDINATE_PRECISION);

            Query* q = new Query();
            q->this_->zoomLevel = 18; //no generalization
            q->this_->printInstructions = true; //turn by turn instructions
            q->this_->alternateRoute = true; //get an alternate route, too
            q->this_->geometry = true; //retrieve geometry of route
            q->this_->compression = true; //polyline encoding
            q->this_->checkSum = UINT_MAX; //see wiki
            q->this_->service = "viaroute"; //that's routing
            q->this_->outputFormat = "json";
            q->this_->jsonpParameter = ""; //set for jsonp wrapping
            q->this_->language = ""; //unused atm
            q->this_->coordinates.push_back(start_coordinate);
            q->this_->coordinates.push_back(end_coordinate);
            q->Wrap(args.This());
            return args.This();
        } else {
            return ThrowException(Exception::TypeError(String::New("please provide an object of options for the first argument")));
        }
    } catch (std::exception const& ex) {
        return ThrowException(Exception::TypeError(String::New(ex.what())));
    }
    return Undefined();
}

void Engine::Initialize(Handle<Object> target) {
    HandleScope scope;
    constructor = Persistent<FunctionTemplate>::New(FunctionTemplate::New(Engine::New));
    constructor->InstanceTemplate()->SetInternalFieldCount(1);
    constructor->SetClassName(String::NewSymbol("Engine"));
    NODE_SET_PROTOTYPE_METHOD(constructor, "run", run);
    NODE_SET_PROTOTYPE_METHOD(constructor, "runSync", run);
    target->Set(String::NewSymbol("Engine"),constructor->GetFunction());
}

Engine::Engine(std::string const& config_path)
  : ObjectWrap(),
    this_(boost::make_shared<OSRM>(config_path.c_str())) { }

Engine::~Engine() { }

Handle<Value> Engine::New(Arguments const& args)
{
    HandleScope scope;
    if (!args.IsConstructCall()) {
        return ThrowException(Exception::Error(String::New("Cannot call constructor as function, you need to use 'new' keyword")));
    }
    try {
        if (args.Length() == 1) {
            if (!args[0]->IsString()) {
                return ThrowException(Exception::TypeError(String::New("OSRM config path must be a string")));
            }
            Engine* im = new Engine(*String::Utf8Value(args[0]->ToString()));
            im->Wrap(args.This());
            return args.This();
        } else {
            return ThrowException(Exception::TypeError(String::New("please provide Engine width and height")));
        }
    } catch (std::exception const& ex) {
        return ThrowException(Exception::Error(String::New(ex.what())));
    }
    return Undefined();
}

Handle<Value> Engine::runSync(Arguments const& args)
{
    HandleScope scope;

    if (args.Length() < 1) {
        ThrowException(Exception::TypeError(String::New("first argument must be a osrm.Query")));
    }

    if (!args[0]->IsObject()) {
        return ThrowException(Exception::TypeError(String::New("first argument must be a osrm.Query object")));
    }

    Local<Object> obj = args[0]->ToObject();
    if (obj->IsNull() || obj->IsUndefined() || !Query::constructor->HasInstance(obj)) {
        return ThrowException(Exception::TypeError(String::New("osrm.Query object expected for first argument")));
    }
    Query *query = ObjectWrap::Unwrap<Query>(obj);
    Engine* machine = ObjectWrap::Unwrap<Engine>(args.This());
    http::Reply osrm_reply;
    machine->this_->RunQuery(*query->get(), osrm_reply);
    return scope.Close(String::New(osrm_reply.content.c_str()));
}

typedef struct {
    uv_work_t request;
    Engine * machine;
    Query * query;
    bool error;
    std::string result;
    Persistent<Function> cb;
} run_query_baton_t;

Handle<Value> Engine::run(Arguments const& args)
{
    HandleScope scope;

    if (args.Length() == 1) {
        return runSync(args);
    }

    if (args.Length() < 1) {
        ThrowException(String::New("first argument must be a osrm.Query"));
    }

    if (!args[0]->IsObject()) {
        return ThrowException(String::New("first argument must be a osrm.Query object"));
    }

    Local<Object> obj = args[0]->ToObject();
    if (obj->IsNull() || obj->IsUndefined() || !Query::constructor->HasInstance(obj)) {
        ThrowException(Exception::TypeError(String::New("osrm.Query object expected for first argument")));
    }

    // ensure callback is a function
    Local<Value> callback = args[args.Length()-1];
    if (!args[args.Length()-1]->IsFunction()) {
        return ThrowException(Exception::TypeError(
                                  String::New("last argument must be a callback function")));
    }

    Query * query = ObjectWrap::Unwrap<Query>(obj);
    Engine * machine = ObjectWrap::Unwrap<Engine>(args.This());
    run_query_baton_t *closure = new run_query_baton_t();
    closure->request.data = closure;
    closure->machine = machine;
    closure->query = query;
    closure->error = false;
    closure->cb = Persistent<Function>::New(Handle<Function>::Cast(callback));
    uv_queue_work(uv_default_loop(), &closure->request, AsyncRun, (uv_after_work_cb)AfterRun);
    closure->machine->_ref();
    closure->query->_ref();
    return Undefined();
}

void Engine::AsyncRun(uv_work_t* req) {
    run_query_baton_t *closure = static_cast<run_query_baton_t *>(req->data);
    try {
        http::Reply osrm_reply;
        closure->machine->this_->RunQuery(*(closure->query->get()), osrm_reply);
        closure->result = osrm_reply.content;
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
    closure->machine->_unref();
    closure->query->_unref();
    closure->cb.Dispose();
    delete closure;
}

extern "C" {
    static void start(Handle<Object> target) {
        Engine::Initialize(target);
        Query::Initialize(target);
    }
}

} // namespace node_osrm

NODE_MODULE(_osrm, node_osrm::start)
