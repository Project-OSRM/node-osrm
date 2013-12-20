// v8
#include <v8.h>

// boost
#include <boost/make_shared.hpp>
#include <boost/shared_ptr.hpp>

// node
#include <node.h>
#include <node_version.h>
#include <node_object_wrap.h>

#include "options.hpp"
#include "query.hpp"
#include "engine.hpp"

namespace node_osrm {

using namespace v8;

extern "C" {
    static void start(Handle<Object> target) {
        Options::Initialize(target);
        Query::Initialize(target);
        Engine::Initialize(target);
    }
}

} // namespace node_osrm

NODE_MODULE(osrm, node_osrm::start)
