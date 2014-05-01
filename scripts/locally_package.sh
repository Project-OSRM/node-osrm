#!/bin/bash

set -u
make clean
rm -rf node_modules/
export CXX11=false
source ~/projects/mapnik-packaging/osx/MacOSX.sh
npm install --build-from-source
make test
npm install aws-sdk
cp `which lua` "./lib/binding/"
cp `which osrm-extract` "./lib/binding/"
cp `which osrm-prepare` "./lib/binding/"
cp `which osrm-datastore` "./lib/binding/"
export PATH=$(pwd)/lib/binding:${PATH}
rm -rf berlin-latest.osrm*
make test
./node_modules/.bin/node-pre-gyp package publish
# node v0.8.x
npm install --build-from-source --target=0.8.26
nvm use 0.8
npm test
./node_modules/.bin/node-pre-gyp package publish --target=0.8.26

