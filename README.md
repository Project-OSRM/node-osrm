# node-osrm

Provides read-only bindings to the [Open Source Routing Machine - OSRM](https://github.com/Project-OSRM/osrm-backend), a routing engine for OpenStreetMap data implementing high-performance algorithms for shortest paths in road networks.


| build config | status |
|:-------------|:------------|
| Linux/OS X   | [![Build Status](https://travis-ci.org/Project-OSRM/node-osrm.svg?branch=master)](https://travis-ci.org/Project-OSRM/node-osrm) [![codecov](https://codecov.io/gh/Project-OSRM/node-osrm/branch/master/graph/badge.svg)](https://codecov.io/gh/Project-OSRM/node-osrm) |

# Documentation

See [docs/api.md](docs/api.md) for extensive API documentation. You can find a simple example in `example/server.js`.

# Depends

 - Node.js v4.x
 - Modern C++ runtime libraries supporting C++14

C++14 capable platforms include:

  - Mac OS X >= 10.10
  - Ubuntu Linux >= 16.04 or other Linux distributions with g++ >= 5 toolchain (>= GLIBCXX_3.4.20 from libstdc++)

An installation error like below indicates your system does not have a modern enough libstdc++/gcc-base toolchain:

```
Error: /usr/lib/x86_64-linux-gnu/libstdc++.so.6: version GLIBCXX_3.4.20 not found (required by /node_modules/osrm/lib/binding/osrm.node)
```

If you are running Ubuntu older than 16.04 you can easily upgrade your libstdc++ version like:

```
sudo add-apt-repository ppa:ubuntu-toolchain-r/test
sudo apt-get update -y
sudo apt-get install -y libstdc++-5-dev
```

#### On Travis:

```yml
addons:
  apt:
    sources: [ 'ubuntu-toolchain-r-test' ]
    packages: [ 'libstdc++-5-dev' ]
```

#### On Circleci:

```yml
dependencies:
     pre:
         - sudo -E apt-add-repository -y "ppa:ubuntu-toolchain-r/test"
         - sudo -E apt-get upgrade -y
         - sudo -E apt-get -yq --no-install-suggests --no-install-recommends --force-yes install libstdc++-5-dev
```


# Installing

By default, binaries are provided for:

 - 64 bit OS X and 64 bit Linux
 - Node v4.x

On those platforms no external dependencies are needed.

Just do:

    npm install osrm

However other platforms will fall back to a source compile: see [Source Build](#source-build) for details.

# Setup

The `node-osrm` module consumes data processed by OSRM core.

This repository contains a Makefile that does this automatically:

- Downloads an OSM extract
- Runs osrm tools to prepare data

Just run:

    make
    make test

Once that is done then you can calculate routes in Javascript like:


# Source Build

## Using Mason

You can build from source by using [mason](https://github.com/mapbox/mason).
Just go to your node-osrm folder and run:

```
make
```

This will download and build the current version of osrm-backend and set all needed variables.

Then you can test like

```
make test
```

To rebuild node-osrm after any source code changes to `src/node_osrm.cpp` simply type again:

```
make
```

If you wish to have a different version of osrm-backend build on the fly, change the `osrm_release` variable in `package.json` and rebuild:

```
make clean
make && make test
```

## Using an existing local osrm-backend

If you do not wish to build node-osrm against an existing osrm-backend that you have on your system you will need:

 - OSRM develop branch cloned, built from source, and installed
 - The test data initialized: `make -C test/data` inside the `osrm-backend` directory

See [Project-OSRM wiki](https://github.com/Project-OSRM/osrm-backend/wiki/Building%20OSRM) for details.

Once Project-OSRM is built you should be able to run:

    pkg-config libosrm --variable=prefix

Which should return the path to where you installed Project-OSRM.

Now you can build `node-osrm`:

    git clone https://github.com/Project-OSRM/node-osrm.git
    cd node-osrm
    npm install --build-from-source

To run the tests against your local osrm-backend's data you will need to
set the `OSRM_DATA_PATH` variable:

    export OSRM_DATA_PATH=/path/to/osrm-backend/test/data

Then you can run `npm test`.

To recap, here is a full example of building against an osrm-backend that is cloned beside node-osrm but installed into a custom location:

```
export PATH=/opt/osrm/bin:${PATH}
export PKG_CONFIG_PATH=/opt/osrm/lib/pkgconfig
pkg-config libosrm --variable=prefix
# if boost headers are in a custom location give a hint about that
# here we assume the are in `/opt/boost`
export CXXFLAGS="-I/opt/boost/include"
npm install --build-from-source
# build the osrm-backend test data
make -C ../osrm-backend/test/data
export OSRM_DATA_PATH=../osrm-backend/test/data
npm test
```

# Developing

After setting up a [Source Build](#source-build) you can make changes to the code and rebuild like:

    npm install --build-from-source

But that will trigger a full re-configure if any changes occurred to dependencies.

However you can optionally use the Makefile which simplifies some common needs.

To rebuild using cached data:

    make

If you want to see all the arguments sent to the compiler do:

    make verbose

If you want to build in debug mode (-DDEBUG -O0) then do:

    make debug

Under the hood this uses [node-pre-gyp](https://github.com/mapbox/node-pre-gyp) (which itself used [node-gyp](https://github.com/TooTallNate/node-gyp)) to compile the source code.

# Testing

Run the tests like:

    make test

