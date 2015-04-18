/*

Copyright (c) 2015, Project OSRM contributors
All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

Redistributions of source code must retain the above copyright notice, this list
of conditions and the following disclaimer.
Redistributions in binary form must reproduce the above copyright notice, this
list of conditions and the following disclaimer in the documentation and/or
other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

*/

// based on
// https://svn.apache.org/repos/asf/mesos/tags/release-0.9.0-incubating-RC0/src/common/json.hpp

#ifndef JSON_V8_RENDERER_HPP
#define JSON_V8_RENDERER_HPP

#include <osrm/json_container.hpp>

// v8
#include <nan.h>

#include <functional>

namespace osrm
{
namespace json
{

struct v8_renderer : mapbox::util::static_visitor<>
{
    explicit v8_renderer(v8::Local<v8::Value>& _out) : out(_out) {}

    void operator()(const String &string) const { out = NanNew(std::cref(string.value)); }

    void operator()(const Number &number) const { out = NanNew(number.value); }

    void operator()(const Object &object) const
    {
        v8::Local<v8::Object> obj = NanNew<v8::Object>();
        for (const auto& keyValue : object.values)
        {
            v8::Local<v8::Value> child;
            mapbox::util::apply_visitor(v8_renderer(child), keyValue.second);
            obj->Set(NanNew(keyValue.first), child);
        }
        out = obj;
    }

    void operator()(const Array &array) const
    {
        v8::Local<v8::Array> a = NanNew<v8::Array>(array.values.size());
        for (auto i = 0u; i < array.values.size(); ++i)
        {
            v8::Local<v8::Value> child;
            mapbox::util::apply_visitor(v8_renderer(child), array.values[i]);
            a->Set(i, child);
        }
        out = a;
    }

    void operator()(const True &) const { out = NanNew(true); }

    void operator()(const False &) const { out = NanNew(false); }

    void operator()(const Null &) const { out = NanNull(); }

  private:
    v8::Local<v8::Value> &out;
};

inline void render(v8::Local<v8::Value> &out, const Object &object)
{
    // FIXME this should be a cast?
    Value value = object;
    mapbox::util::apply_visitor(v8_renderer(out), value);
}

} // namespace json
} // namespace osrm
#endif // JSON_V8_RENDERER_HPP
