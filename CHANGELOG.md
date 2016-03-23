## node-osrm changelog

### v5.0.0-newapi.7

- Updates to osrm-backend v5.0.0-newapi.7:
  * new file .properties needed by the server
  * .datasource_names and .datasource_index are not optional anymore
  * .timestamp is not optional anymore
  * uturns parameter is not per-via but global
  * fixes incorrect turn coordinates

### v5.0.0-newapi.6

- [Static turn instructions](https://github.com/Project-OSRM/osrm-backend/pull/2080)
- [Support multiple traffic update files, and include filename in debug tile metadata](https://github.com/Project-OSRM/osrm-backend/pull/2098)

### v5.0.0-newapi.5

- Fix negative durations
- Inlcude source descriptors in debug vector tiles
- Fix bug in processing dead-ends in the guidance code

### 4.9.0
 - Uses OSRM 4.9.0
 - `table` now supports `sources` and `destinations` options for asymmetric queries
 - `status` and `status_message` were removed. `No route found` (207) and `No matching edge segment found` (208) now throw `Error` Objects (as well as all `400` errors).
 - Ported to NAN2 to support for Node 4.x and 5.x

### 4.8.1

 - Update OSRM to v4.8.1
   Fixes a regression in the alternative route format

### 4.8.0

 - Update OSRM to v4.8.0
 - New js API:
    osrm.trip(options, callback)

### 4.7.1

 - Update OSRM to v4.7.1

### 4.7.0

 - Update OSRM to v4.7.0
 - Support the geometry parameter for route requests

### 4.6.1

 - Update OSRM to v4.6.1
 - Fixes crash when using shared memory

### 4.6.0

 - Update OSRM to v4.6.0
 - New js API:
    osrm.match(options, callback)
 - Behaviour of osrm.table changed! Now returns full json response from OSRM.

### 0.12.0

 - Updated OSRM to 3d3ba86be4af6bcf68 (v0.4.3 release + extras)

### 0.11.2

 - Updated OSRM to 1d3932e8c53ab176b8 (v0.4.2b release)

### 0.10.1

 - Updated OSRM to 7d7cce5c7227c9f71a (v0.4.1 release)

### 0.10.0

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
