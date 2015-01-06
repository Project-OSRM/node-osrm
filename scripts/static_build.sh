#!/bin/bash

set -u

TMP_DEPS_DIR=`mktemp -d -t XXXXXXXXXXX`;
if [[ ${NODE_MODULE_ROOT:-false} == false ]]; then
    NODE_MODULE_ROOT=`pwd`
fi

if [[ ! $(which pkg-config) ]]; then
    echo "missing pkg-config"
    exit 1
fi

git clone --depth=1 https://github.com/mapnik/mapnik-packaging.git  ${TMP_DEPS_DIR}/mapnik-packaging
cd ${TMP_DEPS_DIR}/mapnik-packaging
export CXX11=true
export QUIET=true
source build.sh
build_osrm

cd ${NODE_MODULE_ROOT}
source $(dirname "$BASH_SOURCE")/localize.sh
localize
npm install --build-from-source
