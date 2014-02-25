#ifndef __NODE_OSRM_QUERY_H__
#define __NODE_OSRM_QUERY_H__

// v8
#include <v8.h>

// node
#include <node.h>
#include <node_version.h>
#include <node_object_wrap.h>

#include <osrm/OSRM.h>

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
        if (args.Length() != 1) {
            return ThrowException(Exception::TypeError(String::New("please provide an object of options for the first argument")));
        }
        if (!args[0]->IsObject()) {
            return ThrowException(Exception::TypeError(String::New("first argument must be an object")));
        }
        Local<Object> obj = args[0]->ToObject();
        if (obj->IsNull() || obj->IsUndefined()) {
            return ThrowException(Exception::TypeError(String::New("first arg must be an object")));
        }
        if (!obj->Has(String::NewSymbol("coordinates"))) {
            return ThrowException(Exception::TypeError(String::New("must provide a coordinates property")));
        }
        Local<Value> coordinates = obj->Get(String::New("coordinates"));
        if (!coordinates->IsArray()) {
            return ThrowException(Exception::TypeError(String::New("coordinates must be an array of (lat/long) pairs")));
        }
        Local<Array> coordinates_array = Local<Array>::Cast(coordinates);
        if (coordinates_array->Length() < 2) {
            return ThrowException(Exception::TypeError(String::New("at least two coordinates must be provided")));
        }

        Query* q = new Query();
        q->this_->zoomLevel = 18; //no generalization
        q->this_->printInstructions = false; //turn by turn instructions
        q->this_->alternateRoute = true; //get an alternate route, too
        q->this_->geometry = true; //retrieve geometry of route
        q->this_->compression = true; //polyline encoding
        q->this_->checkSum = UINT_MAX; //see wiki
        q->this_->service = "viaroute"; //that's routing
        q->this_->outputFormat = "json";
        q->this_->jsonpParameter = ""; //set for jsonp wrapping
        q->this_->language = ""; //unused atm

        if (obj->Has(String::NewSymbol("alternateRoute"))) {
            q->this_->alternateRoute = obj->Get(String::New("alternateRoute"))->BooleanValue();
        }

        if (obj->Has(String::NewSymbol("checksum"))) {
            q->this_->checkSum = static_cast<unsigned>(obj->Get(String::New("checksum"))->Uint32Value());
        }

        if (obj->Has(String::NewSymbol("zoomLevel"))) {
            q->this_->zoomLevel = static_cast<short>(obj->Get(String::New("zoomLevel"))->Int32Value());
        }

        if (obj->Has(String::NewSymbol("printInstructions"))) {
            q->this_->printInstructions = obj->Get(String::New("printInstructions"))->BooleanValue();
        }

        if (obj->Has(String::NewSymbol("jsonpParameter"))) {
            q->this_->jsonpParameter = *v8::String::Utf8Value(obj->Get(String::New("jsonpParameter")));
        }

        if (obj->Has(String::NewSymbol("hints"))) {
            Local<Value> hints = obj->Get(String::New("hints"));
            if (!hints->IsArray()) {
                return ThrowException(Exception::TypeError(String::New("hints must be an array of strings/null")));
            }
            Local<Array> hints_array = Local<Array>::Cast(hints);
            for (uint32_t i = 0; i < hints_array->Length(); ++i) {
                Local<Value> hint = hints_array->Get(i);
                if (hint->IsString()) {
                    q->this_->hints.push_back(*v8::String::Utf8Value(hint));
                } else if(hint->IsNull()){
                    q->this_->hints.push_back("");
                }else{
                    return ThrowException(Exception::TypeError(String::New("hint must be null or string")));
                }
            }
        }

        for (uint32_t i = 0; i < coordinates_array->Length(); ++i) {
            Local<Value> coordinate = coordinates_array->Get(i);
            if (!coordinate->IsArray()) {
                return ThrowException(Exception::TypeError(String::New("coordinates must be an array of (lat/long) pairs")));
            }
            Local<Array> coordinate_array = Local<Array>::Cast(coordinate);
            if (coordinate_array->Length() != 2) {
                return ThrowException(Exception::TypeError(String::New("coordinates must be an array of (lat/long) pairs")));
            }
            q->this_->coordinates.push_back(
                FixedPointCoordinate(coordinate_array->Get(0)->NumberValue()*COORDINATE_PRECISION,
                                     coordinate_array->Get(1)->NumberValue()*COORDINATE_PRECISION));
        }

        q->Wrap(args.This());
        return args.This();
    } catch (std::exception const& ex) {
        return ThrowException(Exception::TypeError(String::New(ex.what())));
    }
    return Undefined();
}

} // namespace node_osrm

#endif // __NODE_OSRM_QUERY_H__
