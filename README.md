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

# Quick start

The `node-osrm` module consumes data processed by OSRM core.

For this purpose we ship the binaries `osrm-extract` and `osrm-contract` with the node module.
For example if you want to prepare a Berlin dataset the following will run the osrm toolchain to do that:

```
export PATH="./lib/binding/:$PATH"

wget http://download.geofabrik.de/europe/germany/berlin-latest.osm.pbf
osrm-extract berlin-latest.osm.pbf -p profiles/car.lua
osrm-contract berlin-latest.osrm
```

You can then use the dataset like:

```
const OSRM = require('osrm');
let osrm = new OSRM('berlin-latest.osrm');

osrm.route({coordinates: [[13.388860,52.517037], [13.39319,52.533976]]}, (err, result) => {
  if (err) return;

  console.log(`duration: ${result.routes[0].duration} distance: ${result.routes[0].distance}`);
});
```

See the [full documentation](docs/api.md) for more examples.

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

If you do wish to build node-osrm against an existing osrm-backend we assume it is installed and will be found by pkg-config.

To check if you installed it correctly the following command and verify the output:

    which osrm-extract
    which osrm-contract
    which osrm-datastore
    pkg-config libosrm --variable=prefix

See the [Project-OSRM wiki](https://github.com/Project-OSRM/osrm-backend/wiki/Building%20OSRM) for details in how to build osrm-backend from source.

Now you can build `node-osrm`:

    git clone https://github.com/Project-OSRM/node-osrm.git
    cd node-osrm
    mkdir build
    cd build
    cmake ..
    make clean
    make
    make test

# Developing

After setting up a [Source Build](#source-build) you can make changes to the code and rebuild like any other cmake project:

  cd build
  make

To rebuild using with a full re-configuration do:

    make

If you want to see all the arguments sent to the compiler do:

    make verbose

If you want to build in debug mode (-DDEBUG -O0) then do:

    make debug

# Testing

Run the tests like:

    make test

