#ifndef __NODE_OSRM_OPTIONS_H__
#define __NODE_OSRM_OPTIONS_H__

// v8
#include <v8.h>

// node
#include <node.h>
#include <node_version.h>
#include <node_object_wrap.h>

#include <OSRM.h>

using namespace v8;

namespace node_osrm {

typedef boost::shared_ptr<ServerPaths> server_paths_ptr;

class Options: public node::ObjectWrap {
public:
    static Persistent<FunctionTemplate> constructor;
    static void Initialize(Handle<Object> target);
    static Handle<Value> New(Arguments const& args);
    Options();
    inline server_paths_ptr get() { return this_; }
    void _ref() { Ref(); }
    void _unref() { Unref(); }
    std::string ip_address_;
    int ip_port_;
    int requested_num_threads_;
    bool use_shared_memory_;
private:
    ~Options();
    server_paths_ptr this_;
};

Persistent<FunctionTemplate> Options::constructor;

void Options::Initialize(Handle<Object> target) {
    HandleScope scope;
    constructor = Persistent<FunctionTemplate>::New(FunctionTemplate::New(Options::New));
    constructor->InstanceTemplate()->SetInternalFieldCount(1);
    constructor->SetClassName(String::NewSymbol("Options"));
    target->Set(String::NewSymbol("Options"),constructor->GetFunction());
}

Options::Options()
  : ObjectWrap(),
    ip_address_("0.0.0.0"),
    ip_port_(5000),
    requested_num_threads_(8),
    use_shared_memory_(false),    
    this_(boost::make_shared<ServerPaths>()) { }

Options::~Options() { }

Handle<Value> Options::New(Arguments const& args)
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
            std::string server_config = *String::Utf8Value(args[0]->ToString());
            Options* opts = new Options();
            ServerPaths & server_paths = *opts->get();
            const char * argv[] = {
                "node-osrm",
                "-c",
                server_config.c_str()};
            if( !GenerateServerProgramOptions(
                    3,
                    argv,
                    server_paths,
                    opts->ip_address_,
                    opts->ip_port_,
                    opts->requested_num_threads_,
                    opts->use_shared_memory_
                 )
            ) {
                return ThrowException(Exception::TypeError(String::New("could not parse config file")));
            }
            opts->Wrap(args.This());
            return args.This();
        } else {
            return ThrowException(Exception::TypeError(String::New("must provide a path to a config file")));
        }
    } catch (std::exception const& ex) {
        return ThrowException(Exception::TypeError(String::New(ex.what())));
    }
    return Undefined();
}

} // namespace node_osrm

#endif // __NODE_OSRM_OPTIONS_H__
