#!/bin/bash

set -u -e
make clean
source ~/.nvm/nvm.sh
nvm use 0.10
./node_modules/.bin/node-pre-gyp info
npm install aws-sdk
rm -rf berlin-latest.osrm*
rm -rf node_modules/
rm -rf lib/binding/
export CXX11=true
if [[ $(uname -s) == 'Darwin' ]]; then
    source ~/projects/mapnik-packaging/osx/MacOSX.sh
else
    source ~/projects/mapnik-packaging/osx/Linux.sh
fi
source $(dirname "$BASH_SOURCE")/localize.sh
localize
npm install --build-from-source

make test
./node_modules/.bin/node-pre-gyp package publish