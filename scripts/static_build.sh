#!/bin/bash

set -u
if [[ ${TMP_DEPS_DIR:-false} == false ]]; then
    TMP_DEPS_DIR=/tmp/osrm-build
    rm -rf ${TMP_DEPS_DIR}
    mkdir -p ${TMP_DEPS_DIR}
fi
if [[ ${NODE_MODULE_ROOT:-false} == false ]]; then
    NODE_MODULE_ROOT=`pwd`
fi
git clone --depth=0 https://github.com/mapnik/mapnik-packaging.git  ${TMP_DEPS_DIR}/mapnik-packaging
cd ${TMP_DEPS_DIR}/mapnik-packaging
export CXX11=false
source build.sh
UNAME=$(uname -s);
if [ ${UNAME} = 'Linux' ]; then
    # fixes node/gyp install
    # https://github.com/travis-ci/travis-cookbooks/issues/155
    sudo rm -rf /dev/shm && sudo ln -s /run/shm /dev/shm
fi
build_osrm
if [[ ${PACKAGE_COMMAND_LINE_TOOLS:-false} != false ]]; then
    mkdir -p "${NODE_MODULE_ROOT}/lib/binding/"
    cp `which lua` "${NODE_MODULE_ROOT}/lib/binding/"
    cp `which osrm-extract` "${NODE_MODULE_ROOT}/lib/binding/"
    cp `which osrm-prepare` "${NODE_MODULE_ROOT}/lib/binding/"
    cp `which osrm-datastore` "${NODE_MODULE_ROOT}/lib/binding/"
else
    echo "not packaging command line tools"
fi
