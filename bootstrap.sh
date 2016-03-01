#!/bin/bash

set -e

function dep() {
    ./.mason/mason install $1 $2
    ./.mason/mason link $1 $2
}

# Set 'osrm_release' to a branch, tag, or gitsha in package.json
export OSRM_RELEASE=$(node -e "console.log(require('./package.json').osrm_release)")
export CXX=${CXX:-clang++}
export BUILD_TYPE=${BUILD_TYPE:-Release}
export TARGET_DIR=${TARGET_DIR:-$(pwd)/lib/binding}
export OSRM_REPO=${OSRM_REPO:-"https://github.com/Project-OSRM/osrm-backend.git"}
export OSRM_DIR=$(pwd)/deps/osrm-backend-${BUILD_TYPE}

echo
echo "*******************"
echo -e "OSRM_RELEASE set to:   \033[1m\033[36m ${OSRM_RELEASE}\033[0m"
echo -e "BUILD_TYPE set to:     \033[1m\033[36m ${BUILD_TYPE}\033[0m"
echo "*******************"
echo
echo

if [[ `which pkg-config` ]]; then
    echo "Success: Found pkg-config";
else
    echo "echo you need pkg-config installed";
    exit 1;
fi;

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

    git checkout ${OSRM_RELEASE}

    mkdir -p build
    pushd build
    ../../../mason_packages/.link/bin/cmake ../ -DCMAKE_INSTALL_PREFIX=${MASON_HOME} \
      -DCMAKE_CXX_COMPILER="$CXX" \
      -DBoost_NO_SYSTEM_PATHS=ON \
      -DTBB_INSTALL_DIR=${MASON_HOME} \
      -DCMAKE_INCLUDE_PATH=${MASON_HOME}/include \
      -DCMAKE_LIBRARY_PATH=${MASON_HOME}/lib \
      -DCMAKE_BUILD_TYPE=${BUILD_TYPE} \
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
    all_deps
    # fix install name of tbb
    if [[ `uname -s` == 'Darwin' ]]; then
        install_name_tool -id @loader_path/libtbb.dylib ${MASON_HOME}/lib/libtbb.dylib
        install_name_tool -id @loader_path/libtbb.dylib ${MASON_HOME}/lib/libtbbmalloc.dylib
    fi
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

    LINK_FLAGS=""
    if [[ $(uname -s) == 'Linux' ]]; then
        LINK_FLAGS="${LINK_FLAGS} "'-Wl,-z,origin -Wl,-rpath=\$ORIGIN'
    fi

    build_osrm

    localize
}

main
set +e
