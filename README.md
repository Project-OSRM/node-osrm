# node-osrm

Node.js bindings to the [OSRM](https://github.com/DennisOSRM/Project-OSRM).

[![Build Status](https://secure.travis-ci.org/DennisOSRM/node-OSRM.png)](https://travis-ci.org/DennisOSRM/node-OSRM)

# Depends

 - OSRM `develop` branch, cloned from github.
 - OSRM build with `-DWITH_TOOLS=1` so that `libOSRM` is created
 - Lua, luabind, and stxxl headers
 - Boost >= 1.50 or Luabind headers patched as in https://github.com/DennisOSRM/Project-OSRM/issues/465#issuecomment-9133539 (note: it is possible to patch the luabind headers that are installed by apt)
 - If you use luajit then you may need to put the luajit headers on the compile flags like:

    export CXXFLAGS="-I/usr/include/luajit-2.0/"

# Mavericks

To build with OS X Mavericks you need to ensure the bindings like to `libc++`. An easy way to do this is to set:

    export CXXFLAGS=-mmacosx-version-min=10.9

before building `node-OSRM`.

# Building

To build the bindings you need to build both `Project-OSRM` and `node-OSRM` together:

    git clone -b develop https://github.com/DennisOSRM/Project-OSRM.git
    git clone https://github.com/DennisOSRM/node-OSRM.git
    cd Project-OSRM
    mkdir build;
    cd build;
    cmake ../ -DWITH_TOOLS=1
    make
    cd ../node-OSRM
    npm install

So, the `Project-OSRM` checkout and `node-OSRM` checkout must both sit at the same directory level.

If you hit problems building Project-OSRM see [the wiki](https://github.com/DennisOSRM/Project-OSRM/wiki/Building%20OSRM) for details.

# Testing

Run the tests like:

    make test
