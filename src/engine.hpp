#ifndef __NODE_OSRM_ENGINE_H__
#define __NODE_OSRM_ENGINE_H__

// v8
#include <v8.h>

// node
#include <node.h>
#include <node_version.h>
#include <node_object_wrap.h>

#include <OSRM.h>
#include "query.hpp"
#include "options.hpp"
#include <boost/algorithm/string/join.hpp>

using namespace v8;

namespace node_osrm {

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
    Engine(Options * opts);
    inline osrm_ptr get() { return this_; }
    void _ref() { Ref(); }
    void _unref() { Unref(); }
private:
    ~Engine();
    osrm_ptr this_;
};

Persistent<FunctionTemplate> Engine::constructor;

void Engine::Initialize(Handle<Object> target) {
    HandleScope scope;
    constructor = Persistent<FunctionTemplate>::New(FunctionTemplate::New(Engine::New));
    constructor->InstanceTemplate()->SetInternalFieldCount(1);
    constructor->SetClassName(String::NewSymbol("Engine"));
    NODE_SET_PROTOTYPE_METHOD(constructor, "run", run);
    NODE_SET_PROTOTYPE_METHOD(constructor, "runSync", run);
    target->Set(String::NewSymbol("Engine"),constructor->GetFunction());
}

Engine::Engine(Options * opts)
  : ObjectWrap(),
    this_(boost::make_shared<OSRM>(*opts->get(),opts->use_shared_memory_)) { }

Engine::~Engine() { }

Handle<Value> Engine::New(Arguments const& args)
{
    HandleScope scope;
    if (!args.IsConstructCall()) {
        return ThrowException(Exception::Error(String::New("Cannot call constructor as function, you need to use 'new' keyword")));
    }
    try {
        if (args.Length() == 1) {
            if (!args[0]->IsObject()) {
                return ThrowException(Exception::TypeError(String::New("must provide an osrm.Options object")));
            }
            Local<Object> obj = args[0]->ToObject();
            if (obj->IsNull() || obj->IsUndefined() || !Options::constructor->HasInstance(obj)) {
                return ThrowException(Exception::TypeError(String::New("osrm.Options object expected for first argument")));
            }
            Options *opts = ObjectWrap::Unwrap<Options>(obj);
            Engine* im = new Engine(opts);
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
    return scope.Close(String::New(boost::algorithm::join(osrm_reply.content," ").c_str()));
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
        closure->result = boost::algorithm::join(osrm_reply.content," ");
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

} // namespace node_osrm

#endif // __NODE_OSRM_ENGINE_H__
