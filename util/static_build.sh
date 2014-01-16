#!/bin/bash

git clone --depth=0 https://github.com/mapnik/mapnik-packaging.git
cd mapnik-packaging
export CXX11=false
source build.sh
UNAME=$(uname -s);
if [ ${UNAME} = 'Darwin' ]; then
    build_osrm_for_osx
else
    # fixes node/gyp install
    # https://github.com/travis-ci/travis-cookbooks/issues/155
    sudo rm -rf /dev/shm && sudo ln -s /run/shm /dev/shm
    build_osrm_for_linux
fi
