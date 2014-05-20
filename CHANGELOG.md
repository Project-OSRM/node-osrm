## node-osrm changelog

### master

 - Updated OSRM to f7e09686e5fe0050b8 (v0.4.0 release)

### 0.9.1

 - Updated OSRM to 7b0b378abcfd9463d7 (v0.3.10 release)

### 0.9.0

 - New JS API:
     var osrm = new OSRM([base path]);
     osrm.route(options, callback);
     osrm.locate(latLon, callback);
     osrm.nearest(latLon, callback);
 - Updated OSRM to a1ecab2f95b8bb157b (v0.3.9 release)
 - Fixed the build with latest OSX / clang++
 - Added `example/server.js` to demonstrate basic usage within an http server.
 - Added more `osrm.Query` options: `service`, `printInstructions`, `checksum`, `zoomLevel`, `jsonpParameter`, and `hints`. @Cactusbone.
 - The `service` option accepts a string of either `viaroute`, `nearest`, or `locate`.
 - Removed auto-publish from travis.yml: now developers should manually npm publish when the binaries are ready

### 0.2.8

 - Test release: no code changes

### 0.2.7

 - Fixed tag validation

### 0.2.6

 - Pull binaries from https
 - Upgraded to node-pre-gyp@0.4.0

### 0.2.5

 - Updated OSRM to 40517e3010757bdbb

### 0.2.4

 - Started bundling `osrm-datastore`

### 0.2.0

 - First release with binaries for OS X and Ubuntu Linux