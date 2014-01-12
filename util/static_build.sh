#!/bin/bash

set -e -u -x

git clone https://github.com/mapnik/mapnik-packaging.git
cd mapnik-packaging
export CXX11=false
source build.sh
UNAME=$(uname -s);
if [ ${UNAME} = 'Darwin' ]; then
    build_osrm_for_osx
else
    build_osrm_for_linux
fi
