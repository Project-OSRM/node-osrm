#include <osrm/engine_config.hpp>
#include <osrm/osrm.hpp>

#include <osrm/match_parameters.hpp>
#include <osrm/nearest_parameters.hpp>
#include <osrm/route_parameters.hpp>
#include <osrm/table_parameters.hpp>
#include <osrm/tile_parameters.hpp>
#include <osrm/trip_parameters.hpp>

#include <exception>
#include <memory>
#include <type_traits>
#include <utility>

#include "node_osrm.hpp"
#include "node_osrm_support.hpp"

namespace node_osrm
{

Engine::Engine(osrm::EngineConfig &config) : Base(), this_(std::make_shared<osrm::OSRM>(config)) {}

Nan::Persistent<v8::Function> &Engine::constructor()
{
    static Nan::Persistent<v8::Function> init;
    return init;
}

NAN_MODULE_INIT(Engine::Init)
{
    const auto whoami = Nan::New("OSRM").ToLocalChecked();

    auto fnTp = Nan::New<v8::FunctionTemplate>(New);
    fnTp->InstanceTemplate()->SetInternalFieldCount(1);
    fnTp->SetClassName(whoami);

    SetPrototypeMethod(fnTp, "route", route);
    SetPrototypeMethod(fnTp, "nearest", nearest);
    SetPrototypeMethod(fnTp, "table", table);
    SetPrototypeMethod(fnTp, "tile", tile);
    SetPrototypeMethod(fnTp, "match", match);
    SetPrototypeMethod(fnTp, "trip", trip);

    const auto fn = Nan::GetFunction(fnTp).ToLocalChecked();

    constructor().Reset(fn);

    Nan::Set(target, whoami, fn);
}

NAN_METHOD(Engine::New)
{
    if (info.IsConstructCall())
    {
        try
        {
            auto config = argumentsToEngineConfig(info);
            if (!config)
                return;

            auto *const self = new Engine(*config);
            self->Wrap(info.This());
        }
        catch (const std::exception &ex)
        {
            return Nan::ThrowTypeError(ex.what());
        }

        info.GetReturnValue().Set(info.This());
    }
    else
    {
        return Nan::ThrowTypeError(
            "Cannot call constructor as function, you need to use 'new' keyword");
    }
}

template <typename ParameterParser, typename ServiceMemFn>
inline void async(const Nan::FunctionCallbackInfo<v8::Value> &info,
                  ParameterParser argsToParams,
                  ServiceMemFn service,
                  bool requires_multiple_coordinates)
{
    auto params = argsToParams(info, requires_multiple_coordinates);
    if (!params)
        return;

    BOOST_ASSERT(params->IsValid());

    if (!info[info.Length() - 1]->IsFunction())
        return Nan::ThrowTypeError("last argument must be a callback function");

    auto *const self = Nan::ObjectWrap::Unwrap<Engine>(info.Holder());
    using ParamPtr = decltype(params);

    struct Worker final : Nan::AsyncWorker
    {
        using Base = Nan::AsyncWorker;

        Worker(std::shared_ptr<osrm::OSRM> osrm_,
               ParamPtr params_,
               ServiceMemFn service,
               Nan::Callback *callback)
            : Base(callback), osrm{std::move(osrm_)}, service{std::move(service)},
              params{std::move(params_)}
        {
        }

        void Execute() override try
        {
            const auto status = ((*osrm).*(service))(*params, result);
            ParseResult(status, result);
        }
        catch (const std::exception &e)
        {
            SetErrorMessage(e.what());
        }

        void HandleOKCallback() override
        {
            Nan::HandleScope scope;

            const constexpr auto argc = 2u;
            v8::Local<v8::Value> argv[argc] = {Nan::Null(), render(result)};

            callback->Call(argc, argv);
        }

        // Keeps the OSRM object alive even after shutdown until we're done with callback
        std::shared_ptr<osrm::OSRM> osrm;
        ServiceMemFn service;
        const ParamPtr params;

        // All services return json::Object .. except for Tile!
        using ObjectOrString =
            typename std::conditional<std::is_same<ParamPtr, tile_parameters_ptr>::value,
                                      std::string,
                                      osrm::json::Object>::type;

        ObjectOrString result;
    };

    auto *callback = new Nan::Callback{info[info.Length() - 1].As<v8::Function>()};
    Nan::AsyncQueueWorker(new Worker{self->this_, std::move(params), service, callback});
}

NAN_METHOD(Engine::route) //
{
    async(info, &argumentsToRouteParameter, &osrm::OSRM::Route, true);
}
NAN_METHOD(Engine::nearest) //
{
    async(info, &argumentsToNearestParameter, &osrm::OSRM::Nearest, false);
}
NAN_METHOD(Engine::table) //
{
    async(info, &argumentsToTableParameter, &osrm::OSRM::Table, true);
}
NAN_METHOD(Engine::tile)
{
    async(info, &argumentsToTileParameters, &osrm::OSRM::Tile, {/*unused*/});
}
NAN_METHOD(Engine::match) //
{
    async(info, &argumentsToMatchParameter, &osrm::OSRM::Match, true);
}
NAN_METHOD(Engine::trip) //
{
    async(info, &argumentsToTripParameter, &osrm::OSRM::Trip, true);
}

} // namespace node_osrm
