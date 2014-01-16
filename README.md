# node-osrm

Routing engine for OpenStreetMap data implementing high-performance algorithms for shortest paths in road networks.

Provides bindings to the [Open Source Routing Machine - OSRM](https://github.com/DennisOSRM/Project-OSRM).

[![Build Status](https://secure.travis-ci.org/DennisOSRM/node-osrm.png)](https://travis-ci.org/DennisOSRM/node-osrm)

# Depends

 - Node.js v0.10.x or v0.8.x

# Installing

By default, binaries are provided for:

 - 64 bit OS X and 64 bit Linux
 - Node v0.8.x and v0.10.x

On those platforms no external dependencies are needed.

Just do:

    npm install osrm

However other platforms will fall back to a source compile: see [Source Build](#source-build) for details.

# Usage

1) Download an osm extract and process it with OSRM.

2) Create an OSRM config (ini) file that references the OSRM prepared routing data.

This repository contains a Makefile to automatically do this, assuming you have OSRM installed.

Just run:

    make berlin-latest.osrm.hsgr

3) Next, since we want to use node-osrm locally, do:

    export NODE_PATH=lib

Once that is done then you can calculate routes in Javascript like:

```js
var osrm = require('osrm')
var opts = new osrm.Options("./test/data/berlin.ini");
var engine = new osrm.Engine(opts);
var query = new osrm.Query({coordinates: [[52.519930,13.438640], [52.513191,13.415852]]});
var sync_result = engine.run(query);
JSON.parse(engine.run(query));
{ status: 0,
  status_message: 'Found route between points',
  route_geometry: '{~pdcBmjfsXsBrD{KhS}DvHyApCcf@l}@kg@z|@_MbX|GjHdXh^fm@dr@~\\l_@pFhF|GjCfeAbTdh@fFqRp}DoEn\\cHzR{FjLgCnFuBlG{AlHaAjJa@hLXtGnCnKtCnFxCfCvEl@lHBzA}@vIoFzCs@|CcAnEQ~NhHnf@zUpm@rc@d]zVrTnTr^~]xbAnaAhSnPgJd^kExPgOzk@maAx_Ek@~BuKvd@cJz`@oAzFiAtHvKzAlBXzNvB|b@hGl@Dha@zFbGf@fBAjQ_AxEbA`HxBtPpFpa@rO_Cv_B_ZlD}LlBGB',
  route_instructions: 
   [ ... ],
  route_summary: 
   { total_distance: 2814,
     total_time: 211,
     start_point: 'Friedenstraße',
     end_point: 'Am Köllnischen Park' },
  alternative_geometries: [],
  alternative_instructions: [],
  alternative_summaries: [],
  route_name: 
   [ 'Lichtenberger Straße',
     'Holzmarktstraße' ],
  alternative_names: [ [ '', '' ] ],
  via_points: 
   [ [ 52.519934, 13.438647 ],
     [ 52.513162, 13.415509 ] ],
  via_indices: [ 0, 69 ],
  alternative_indices: [],
  hint_data: 
   { checksum: 222545162,
     locations: 
      [ '9XkCAJgBAAAtAAAA____f7idcBkPGuw__mMhA7cOzQA',
        'TgcEAFwFAAAAAAAAVAAAANIeb5DqBHs_ikkhA1W0zAA' ] } }
```

# Source Build

 - OSRM `develop` branch, cloned from github.
 - OSRM build with `-DWITH_TOOLS=1` so that `libOSRM` is created
 - Lua, luabind, and stxxl headers
 - Boost >= 1.50 or Luabind headers patched as in https://github.com/DennisOSRM/Project-OSRM/issues/465#issuecomment-9133539 (note: it is possible to patch the luabind headers that are installed by apt)
 - If you use luajit then you may need to put the luajit headers on the compile flags like:

    export CXXFLAGS="-I/usr/include/luajit-2.0/"

### Mavericks

To build with OS X Mavericks you need to ensure the bindings link to `libc++`. An easy way to do this is to set:

    export CXXFLAGS=-mmacosx-version-min=10.9

before building `node-osrm`.

### Building

To build the bindings you need to first build and **install** the `develop` branch of `Project-OSRM`:

    # grab develop branch
    git clone -b develop https://github.com/DennisOSRM/Project-OSRM.git
    cd Project-OSRM
    mkdir build;
    cd build;
    cmake ../ -DWITH_TOOLS=1
    make
    sudo make install

NOTE: If you hit problems building Project-OSRM see [the wiki](https://github.com/DennisOSRM/Project-OSRM/wiki/Building%20OSRM) for details.

Then build `node-osrm` against `Project-OSRM` installed in `/usr/local`:

    git clone https://github.com/DennisOSRM/node-osrm.git
    cd node-osrm
    npm install


# Developing

Developers of `node-osrm` should set up a [Source Build](#source-build) and after changes to the code run:

    make

Under the hood this uses [node-gyp](https://github.com/TooTallNate/node-gyp) to compile the source code.

Releasing a new version of `node-osrm` requires:

1. Changing the package.json version: either increment the version of remove the `-alpha` flag
1. Tagging a new release with git: `git tag v0.3.0 -m "Tagging v0.3.0`
1. Pushing the tag to github: `git push --tags`

After pushing the tag Travis.ci will automatically:

 - Build binaries and publish them to S3 with [node-pre-gyp](https://github.com/springmeyer/node-pre-gyp)
 - Run tests, and upon success
 - Will run `npm publish` to push the package to the npm registry

# Testing

Run the tests like:

    make test

