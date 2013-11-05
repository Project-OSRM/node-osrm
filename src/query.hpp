#ifndef __NODE_OSRM_QUERY_H__
#define __NODE_OSRM_QUERY_H__

// v8
#include <v8.h>

// node
#include <node.h>
#include <node_version.h>
#include <node_object_wrap.h>

#include <OSRM.h>

using namespace v8;

namespace node_osrm {

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
            FixedPointCoordinate start_coordinate(start_array->Get(0)->NumberValue()*COORDINATE_PRECISION,
                                         start_array->Get(1)->NumberValue()*COORDINATE_PRECISION);
            FixedPointCoordinate end_coordinate(end_array->Get(0)->NumberValue()*COORDINATE_PRECISION,
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

} // namespace node_osrm

#endif // __NODE_OSRM_QUERY_H__
