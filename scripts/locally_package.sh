#!/bin/bash

set -u -e
./node_modules/.bin/node-pre-gyp info
make clean
npm install aws-sdk
rm -rf berlin-latest.osrm*
rm -rf node_modules/
rm -rf lib/binding/
export CXX11=true
source ~/projects/mapnik-packaging/osx/MacOSX.sh

source $(dirname "$BASH_SOURCE")/localize.sh
localize
npm install --build-from-source

make test
./node_modules/.bin/node-pre-gyp package publish