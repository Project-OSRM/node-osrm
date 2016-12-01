#!/bin/bash

set -eu
set -o pipefail

if [[ `which pkg-config` ]]; then
    echo "Success: Found pkg-config";
else
    echo "echo you need pkg-config installed";
    exit 1;
fi;

if [[ `which node` ]]; then
    echo "Success: Found node";
else
    echo "echo you need node installed";
    exit 1;
fi;

# Set 'osrm_release' to a branch, tag, or gitsha in package.json
export OSRM_RELEASE=$(node -e "console.log(require('./package.json').osrm_release)")
export CXX=${CXX:-clang++}
export CC=${CC:-clang}
export BUILD_TYPE=${BUILD_TYPE:-Release}
export TARGET_DIR=${TARGET_DIR:-$(pwd)/lib/binding}
export OSRM_REPO=${OSRM_REPO:-"https://github.com/Project-OSRM/osrm-backend.git"}
export OSRM_DIR=$(pwd)/deps/osrm-backend-${BUILD_TYPE}
export JOBS=${JOBS:-1}
export TMP_PREFIX=${TMP_PREFIX:-"/tmp/osrm-backend"}
export CLANG_VERSION="${CLANG_VERSION:-3.8.1}"
export CCACHE_VERSION=3.3.1
export CMAKE_VERSION=3.6.2
export TBB_VERSION=43_20150316
export MASON_CMD=${OSRM_DIR}/third_party/mason/mason

echo
echo "*******************"
echo -e "OSRM_RELEASE set to:   \033[1m\033[36m ${OSRM_RELEASE}\033[0m"
echo -e "BUILD_TYPE set to:     \033[1m\033[36m ${BUILD_TYPE}\033[0m"
echo -e "CXX set to:            \033[1m\033[36m ${CXX}\033[0m"
echo -e "CC set to:             \033[1m\033[36m ${CC}\033[0m"
echo -e "JOBS set to:           \033[1m\033[36m ${JOBS}\033[0m"
echo -e "TMP_PREFIX set to: \033[1m\033[36m ${TMP_PREFIX}\033[0m"
echo "*******************"
echo
echo

function localize() {
    mkdir -p ${TARGET_DIR}
    if [[ $(uname -s) == 'Darwin' ]]; then
        pushd ${OSRM_DIR}
        TBB_LIB_PATH=$(${MASON_CMD} prefix tbb ${TBB_VERSION})/lib/libtbb.dylib
        popd
        cp ${TBB_LIB_PATH} "${TARGET_DIR}/"
        install_name_tool -id @loader_path/libtbb.dylib ${TARGET_DIR}/libtbb.dylib
        for i in $(ls ${TMP_PREFIX}/bin/osrm-*); do
            install_name_tool -change @rpath/libtbb.dylib @loader_path/libtbb.dylib $i
        done
    else
        pushd ${OSRM_DIR}
        TBB_LIB_PATH=$(${MASON_CMD} prefix tbb ${TBB_VERSION})/lib/libtbb.so*
        popd
        cp -r ${TBB_LIB_PATH} "${TARGET_DIR}/"
    fi
    cp -r ${TMP_PREFIX}/bin/osrm-* "${TARGET_DIR}/"
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
    OSRM_HASH=$(git rev-parse HEAD)

    echo
    echo "*******************"
    echo -e "Using osrm-backend   \033[1m\033[36m ${OSRM_HASH}\033[0m"
    echo "*******************"
    echo

    # only install clang for linux, OSX has xcode clang
    if [[ $(uname -s) != 'Darwin' ]]; then
        ${MASON_CMD} install clang++ ${CLANG_VERSION}
        export PATH=$(${MASON_CMD} prefix clang++ ${CLANG_VERSION})/bin:${PATH}
        ${MASON_CMD} install binutils 2.27
        export PATH=$(${MASON_CMD} prefix binutils 2.27)/bin:${PATH}
    fi
    # install cmake and ccache
    ${MASON_CMD} install ccache ${CCACHE_VERSION}
    export PATH=$(${MASON_CMD} prefix ccache ${CCACHE_VERSION})/bin:${PATH}
    ${MASON_CMD} install cmake ${CMAKE_VERSION}
    export PATH=$(${MASON_CMD} prefix cmake ${CMAKE_VERSION})/bin:${PATH}

    mkdir -p build
    pushd build
    CMAKE_EXTRA_ARGS=""
    if [[ ${AR:-false} != false ]]; then
        CMAKE_EXTRA_ARGS="${CMAKE_EXTRA_ARGS} -DCMAKE_AR=${AR}"
    fi
    if [[ ${RANLIB:-false} != false ]]; then
        CMAKE_EXTRA_ARGS="${CMAKE_EXTRA_ARGS} -DCMAKE_RANLIB=${RANLIB}"
    fi
    if [[ ${NM:-false} != false ]]; then
        CMAKE_EXTRA_ARGS="${CMAKE_EXTRA_ARGS} -DCMAKE_NM=${NM}"
    fi
    cmake ../ -DCMAKE_INSTALL_PREFIX=${TMP_PREFIX} \
      -DENABLE_MASON=ON \
      -DCMAKE_C_COMPILER=${CC} \
      -DCMAKE_CXX_COMPILER=${CXX} \
      -DCMAKE_BUILD_TYPE=${BUILD_TYPE} \
      -DCMAKE_EXE_LINKER_FLAGS="${LINK_FLAGS}" \
      -DCMAKE_SHARED_LINKER_FLAGS="${LINK_FLAGS}" \
      -DBoost_USE_STATIC_LIBS=ON \
      ${CMAKE_EXTRA_ARGS}
    make -j${JOBS} VERBOSE=1 && make install
    popd
    popd
}

function main() {

    export PKG_CONFIG_PATH=${TMP_PREFIX}/lib/pkgconfig

    LINK_FLAGS=""
    if [[ $(uname -s) == 'Linux' ]]; then
        LINK_FLAGS="${LINK_FLAGS} "'-Wl,-z,origin -Wl,-rpath=\$ORIGIN'
        # ensure rpath is picked up by node-osrm build
        export LDFLAGS='-Wl,-z,origin -Wl,-rpath=\$$ORIGIN '${LDFLAGS:-}
    fi

    build_osrm
    localize
}

main

set +eu
set +o pipefail
