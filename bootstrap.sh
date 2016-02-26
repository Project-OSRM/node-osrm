#!/bin/bash

set -e

function dep() {
    ./.mason/mason install $1 $2
    ./.mason/mason link $1 $2
}

CURRENT_DIR=$(pwd)

# default to clang
CXX=${CXX:-clang++}
TARGET=${TARGET:-Release}
OSRM_RELEASE=${OSRM_RELEASE:-"develop"}
OSRM_REPO=${OSRM_REPO:-"https://github.com/Project-OSRM/osrm-backend.git"}
OSRM_DIR=deps/osrm-backend-${TARGET}

function all_deps() {
    dep cmake 3.2.2 &
    dep lua 5.3.0 &
    dep luabind dev &
    dep boost 1.57.0 &
    dep boost_libsystem 1.57.0 &
    dep boost_libthread 1.57.0 &
    dep boost_libfilesystem 1.57.0 &
    dep boost_libprogram_options 1.57.0 &
    dep boost_libregex 1.57.0 &
    dep boost_libiostreams 1.57.0 &
    dep boost_libtest 1.57.0 &
    dep boost_libdate_time 1.57.0 &
    dep expat 2.1.0 &
    dep stxxl 1.4.1 &
    dep bzip 1.0.6 &
    dep zlib system &
    dep tbb 43_20150316 &
    wait
}

function move_tool() {
    cp ${MASON_HOME}/bin/$1 "${TARGET_DIR}/"
}

function copy_tbb() {
    if [[ `uname -s` == 'Darwin' ]]; then
        cp ${MASON_HOME}/lib/libtbb.dylib ${TARGET_DIR}/
        cp ${MASON_HOME}/lib/libtbbmalloc.dylib ${TARGET_DIR}/
    else
        cp ${MASON_HOME}/lib/libtbb.so.2 ${TARGET_DIR}/
        cp ${MASON_HOME}/lib/libtbbmalloc.so.2 ${TARGET_DIR}/
        cp ${MASON_HOME}/lib/libtbbmalloc_proxy.so.2 ${TARGET_DIR}/
    fi
}

function localize() {
    mkdir -p ${TARGET_DIR}
    copy_tbb
    cp ${MASON_HOME}/bin/lua ${TARGET_DIR}
    move_tool osrm-extract
    move_tool osrm-datastore
    move_tool osrm-prepare
}

function build_osrm() {
    if [[ ! -d ${OSRM_DIR} ]]; then
        echo "Fresh clone."
        mkdir -p ${OSRM_DIR}
        git clone ${OSRM_REPO} ${OSRM_DIR}
        pushd ${OSRM_DIR}
    else
        echo "Already cloned, fetching."
        pushd ${OSRM_DIR}
        git fetch
    fi


    echo "Using OSRM ${OSRM_RELEASE}"
    echo "Using OSRM ${OSRM_REPO}"
    git checkout ${OSRM_RELEASE}
    git reset --hard origin/${OSRM_RELEASE}

    mkdir -p build
    pushd build
    cmake ../ -DCMAKE_INSTALL_PREFIX=${MASON_HOME} \
      -DCMAKE_CXX_COMPILER="$CXX" \
      -DBoost_NO_SYSTEM_PATHS=ON \
      -DTBB_INSTALL_DIR=${MASON_HOME} \
      -DCMAKE_INCLUDE_PATH=${MASON_HOME}/include \
      -DCMAKE_LIBRARY_PATH=${MASON_HOME}/lib \
      -DCMAKE_BUILD_TYPE=${TARGET} \
      -DCMAKE_EXE_LINKER_FLAGS="${LINK_FLAGS}"
    make -j${JOBS} && make install
    popd

    popd
}

function main() {
    if [[ ! -d ./.mason ]]; then
        git clone --depth 1 https://github.com/mapbox/mason.git ./.mason
    fi
    export MASON_DIR=$(pwd)/.mason
    export MASON_HOME=$(pwd)/mason_packages/.link
    if [[ ! -d ${MASON_HOME} ]]; then
        all_deps
    fi
    # fix install name of tbb
    if [[ `uname -s` == 'Darwin' ]]; then
        install_name_tool -id @loader_path/libtbb.dylib ${MASON_HOME}/lib/libtbb.dylib
        install_name_tool -id @loader_path/libtbb.dylib ${MASON_HOME}/lib/libtbbmalloc.dylib
    fi
    export PATH=${MASON_HOME}/bin:$PATH
    export PKG_CONFIG_PATH=${MASON_HOME}/lib/pkgconfig

    # environment variables to tell the compiler and linker
    # to prefer mason paths over other paths when finding
    # headers and libraries. This should allow the build to
    # work even when conflicting versions of dependencies
    # exist on global paths
    # stopgap until c++17 :) (http://www.open-std.org/JTC1/SC22/WG21/docs/papers/2014/n4214.pdf)
    export C_INCLUDE_PATH="${MASON_HOME}/include"
    export CPLUS_INCLUDE_PATH="${MASON_HOME}/include"
    export LIBRARY_PATH="${MASON_HOME}/lib"

    if [[ ! -d ./node_modules/node-pre-gyp ]]; then
        npm install node-pre-gyp
    fi

    export TARGET_DIR=$(./node_modules/.bin/node-pre-gyp reveal module_path --silent)

    LINK_FLAGS=""
    if [[ $(uname -s) == 'Linux' ]]; then
        LINK_FLAGS="${LINK_FLAGS} "'-Wl,-z,origin -Wl,-rpath=\$ORIGIN'
    fi

    build_osrm

    localize

    #if [[ `uname -s` == 'Darwin' ]]; then otool -L ./lib/binding/* || true; fi
    #if [[ `uname -s` == 'Linux' ]]; then readelf -d ./lib/binding/* || true; fi
    echo "success: now run 'npm install --build-from-source'"
}

main
set +e
