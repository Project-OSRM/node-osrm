# node-osrm

Node.js bindings to the [OSRM](https://github.com/DennisOSRM/Project-OSRM).

[![Build Status](https://secure.travis-ci.org/DennisOSRM/node-OSRM.png)](https://travis-ci.org/DennisOSRM/node-OSRM)

# Depends

 - OSRM >= v0.3.6. If using OSRM from github you need to track the develop `develop` branch
 - You also need to build OSRM with `cmake ../ -DWITH_TOOLS=1`
 - Lua, luabind, and stxxl headers
 - Boost >= 1.50 or Luabind headers patched as in https://github.com/DennisOSRM/Project-OSRM/issues/465#issuecomment-9133539 (note: it is possible to patch the luabind headers that are installed by apt)
 - If you use luajit then you need to put the luajit headers on the compile flags like:

    export CXXFLAGS="-I/usr/include/luajit-2.0/"

# Building

To build the bindings do:

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

# Testing

Run the tests like:

    make test
