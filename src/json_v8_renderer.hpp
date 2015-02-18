/*

Copyright (c) 2015, Project OSRM, Dennis Luxen, others
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

#ifndef JSON_RENDERER_HPP
#define JSON_RENDERER_HPP

#include <osrm/json_container.hpp>

namespace osrm
{
namespace json
{
namespace detail {
std::string double_fixed_to_string(const double value)
{
    std::string output = std::to_string(value);
    if (output.size() >= 2 && output[output.size() - 2] == '.' &&
        output[output.size() - 1] == '0')
    {
        output.resize(output.size() - 2);
    }
    return output;
}

}


template<class output_container>
struct renderer : mapbox::util::static_visitor<>
{
    explicit renderer(output_container &_out) : out(_out) {}

    void operator()(const String &string) const
    {
        out.push_back('\"');
        out.insert(out.end(), string.value.begin(), string.value.end());
        out.push_back('\"');
    }

    void operator()(const Number &number) const
    {
        const std::string number_string = detail::double_fixed_to_string(number.value);
        out.insert(out.end(), number_string.begin(), number_string.end());
    }

    void operator()(const Object &object) const
    {
        out.push_back('{');
        auto iterator = object.values.begin();
        while (iterator != object.values.end())
        {
            out.push_back('\"');
            out.insert(out.end(), (*iterator).first.begin(), (*iterator).first.end());
            out.push_back('\"');
            out.push_back(':');

            mapbox::util::apply_visitor(renderer(out), (*iterator).second);
            if (++iterator != object.values.end())
            {
                out.push_back(',');
            }
        }
        out.push_back('}');
    }

    void operator()(const Array &array) const
    {
        out.push_back('[');
        std::vector<Value>::const_iterator iterator;
        iterator = array.values.begin();
        while (iterator != array.values.end())
        {
            mapbox::util::apply_visitor(renderer(out), *iterator);
            if (++iterator != array.values.end())
            {
                out.push_back(',');
            }
        }
        out.push_back(']');
    }

    void operator()(const True &) const
    {
        const std::string temp("true");
        out.insert(out.end(), temp.begin(), temp.end());
    }

    void operator()(const False &) const
    {
        const std::string temp("false");
        out.insert(out.end(), temp.begin(), temp.end());
    }

    void operator()(const Null &) const
    {
        const std::string temp("null");
        out.insert(out.end(), temp.begin(), temp.end());
    }

  private:
    output_container &out;
};

template<class output_container>
void render(output_container &out, const Object &object)
{
    Value value = object;
    mapbox::util::apply_visitor(renderer<output_container>(out), value);
}

} // namespace json
} // namespace osrm
#endif // JSON_RENDERER_HPP
