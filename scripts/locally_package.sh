#!/bin/bash

set -u
make clean
npm install aws-sdk
rm -rf node_modules/
rm -rf lib/binding/
export CXX11=true
source ~/projects/mapnik-packaging/osx/MacOSX.sh

if [[ ${UNAME} == 'Linux' ]]; then
   export LDFLAGS="-Wl,-z,origin -Wl,-rpath=\$$ORIGIN/tbb/ ${LDFLAGS}"
fi

npm install --build-from-source

function localize() {
    cp `which $1` "./lib/binding/"
    if [[ ${UNAME} == 'Darwin' ]]; then
        install_name_tool -change libtbb.dylib @loader_path/tbb/libtbb.dylib ./lib/binding/$1
        install_name_tool -change libtbbmalloc.dylib @loader_path/tbb/libtbbmalloc.dylib ./lib/binding/$1
    fi
}

mkdir -p lib/binding/tbb/
cp `which lua` "./lib/binding/"
cp ${BUILD}/lib/libtbb.dylib lib/binding/tbb/
cp ${BUILD}/lib/libtbbmalloc.dylib lib/binding/tbb/
localize osrm-extract
localize osrm-datastore
localize osrm-prepare

make test
export PATH=$(pwd)/lib/binding:${PATH}
rm -rf berlin-latest.osrm*
make test
: '
./node_modules/.bin/node-pre-gyp package publish
# node v0.8.x
npm install --build-from-source --target=0.8.26
nvm use 0.8
npm test
./node_modules/.bin/node-pre-gyp package publish --target=0.8.26

'