# node-osrm

Provides read-only bindings to the [Open Source Routing Machine - OSRM](https://github.com/Project-OSRM/osrm-backend), a routing engine for OpenStreetMap data implementing high-performance algorithms for shortest paths in road networks.

[![Build Status](https://travis-ci.org/Project-OSRM/node-osrm.svg?branch=master)](https://travis-ci.org/Project-OSRM/node-osrm)

# Depends

 - Node.js v0.10.x
 - Modern C++ runtime libraries supporting C++11

C++11 capable platforms include:

  - Mac OS X >= 10.7
  - Ubuntu Linux >= 14.04 or other Linux distributions with g++ >= 4.8 toolchain (>= GLIBC_2.17 from libc and >= GLIBCXX_3.4.17 from libstdc++)

An installation error like below indicates your system does not have a modern enough g++ toolchain:

```
Error: /usr/lib/x86_64-linux-gnu/libstdc++.so.6: version `GLIBCXX_3.4.17' not found (required by /node_modules/osrm/lib/binding/osrm.node)
```

If you are running Ubuntu older than 14.04 you can easily upgrade your g++ toolchain like:

```
sudo add-apt-repository ppa:ubuntu-toolchain-r/test
sudo apt-get update
sudo apt-get install g++-4.8
```


# Installing

By default, binaries are provided for:

 - 64 bit OS X and 64 bit Linux
 - Node v0.10.x

On those platforms no external dependencies are needed.

Just do:

    npm install osrm

However other platforms will fall back to a source compile: see [Source Build](#source-build) for details.

# Usage

See the `example/server.js` and `test/osrm.test.js` for examples of using OSRM through this Node.js API.

# Setup

The `node-osrm` module consumes data processed by OSRM core.

This repository contains a Makefile that does this automatically:

- Downloads an OSM extract
- Runs `osrm-extract` and `osrm-prepare`
- Has a OSRM config (ini) file that references the prepared data

Just run:

    make berlin-latest.osrm.hsgr

Once that is done then you can calculate routes in Javascript like:

```js
// Note: to require osrm locally do:
// require('./lib/osrm.js')
var OSRM = require('osrm')
var osrm = new OSRM("berlin-latest.osrm");

osrm.locate([52.4224,13.333086], function (err, result) {
  console.log(result);
  // Output: {"status":0,"mapped_coordinate":[52.422442,13.332101]}
});

osrm.nearest([52.4224, 13.333086], function (err, result) {
  console.log(result);
  // Output: {"status":0,"mapped_coordinate":[52.422590,13.333838],"name":"Mariannenstraße"}
});

var query = {coordinates: [[52.519930,13.438640], [52.513191,13.415852]]};
osrm.route(query, function (err, result) {
  console.log(result);
  /* Output:
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
  */
});
```

# Source Build

To build from source you will need:

 - OSRM >= 0.4.2

See [Project-OSRM wiki](https://github.com/Project-OSRM/osrm-backend/wiki/Building%20OSRM) for details.

Once Project-OSRM is built you should be able to run:

    pkg-config libosrm --variable=prefix

Which should return the path to where you installed Project-OSRM.

Now you can build `node-osrm`:

    git clone https://github.com/Project-OSRM/node-osrm.git
    cd node-osrm
    npm install --build-from-source

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

# Releasing

Releasing a new version of `node-osrm` is mostly automated using travis.ci.

### Steps to release

1. Confirm the desired OSRM branch and commit.

   This is configurable via the `OSRM_BRANCH` and `OSRM_COMMIT` variables in the `.travis.yml`.

1. Bump node-osrm version

   Update the `CHANGELOG.md` and the `package.json` version if needed.

1. Check Travis.ci

   Ensure Travis.ci [builds are passing](https://travis-ci.org/Project-OSRM/node-osrm) after your last commit.

1. Publishing binaries

   If travis builds are passing then it's time to publish binaries by committing with a message containing `[publish binary]`. If you don't have anything to commit then you can do:

   ```
   git commit --allow-empty -m "[publish binary]"
   ```

1. Test

   Locally you can now test binaries. Cleanup, re-install, and run the tests like:

   ```
   make clean
   npm install # will pull remote binaries
   npm ls # confirm deps are correct
   make test
   ```

   Confirm the remote binaries are available by running node-pre-gyp locally:

   ```
   $ ./node_modules/.bin/node-pre-gyp info --loglevel silent | grep `node -e "console.log(require('./package.json').version)"`
   osrm-v0.2.8-node-v11-darwin-x64.tar.gz
   osrm-v0.2.8-node-v11-linux-x64.tar.gz
   ```

1. Tag

   Once binaries are published for Linux and OS X then its time to tag a new release:

   ```
   git tag v0.2.8 -m "Tagging v0.2.8"
   git push --tags
   ```

1. Publish node-osrm

   First ensure your local node-pre-gyp is up to date:

   ```
   npm ls
   ```

   This is important because it is bundled during packaging.

   If you see any errors then do:

   ```
   rm -rf node_modules/node-pre-gyp
   npm install node-pre-gyp
   ```

   Now we're ready to publish `node-osrm` to <https://www.npmjs.org/package/osrm>:

   ```
   npm publish
   ```

   Dependent apps can now pull from the npm registry like:

   ```
   "dependencies": {
       "osrm": "~0.2.8"
   }
   ```

   Or can still pull from the github tag like:

   ```
   "dependencies": {
       "osrm": "https://github.com/Project-OSRM/node-osrm/tarball/v0.2.8"
   }
   ```
