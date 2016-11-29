#!/usr/bin/env bash

set -eu
set -o pipefail

# defaults
export COVERAGE=${COVERAGE:-false}
export NODE=${NODE:-4}

export CURRENT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

export DEPS_DIR="$(pwd)/deps"
export PATH=${DEPS_DIR}/bin:${PATH}
mkdir -p ${DEPS_DIR}

export CLANG_VERSION="${CLANG_VERSION:-3.8.1}"
export CCACHE_VERSION=3.3.1
export CMAKE_VERSION=3.6.2

source ${CURRENT_DIR}/travis_helper.sh

# ensure we start inside the root directory (one level up)
cd ${CURRENT_DIR}/../

if [[ ! $(which wget) ]]; then
    echo "echo wget must be installed";
    exit 1;
fi;

SYSTEM_NAME=$(uname -s)
if [[ "${SYSTEM_NAME}" == "Darwin" ]]; then
    OS_NAME="osx"
elif [[ "${SYSTEM_NAME}" == "Linux" ]]; then
    OS_NAME="linux"
fi

# FIXME This should be replaced by proper calls to mason but we currently have a chicken-egg problem
# since we rely on osrm-backend to ship mason for us. Once we merged this into osrm-backend this will not be needed.
CMAKE_URL="https://s3.amazonaws.com/mason-binaries/${OS_NAME}-x86_64/cmake/${CMAKE_VERSION}.tar.gz"
echo "Downloading cmake from ${CMAKE_URL} ..."
wget --quiet -O - ${CMAKE_URL} | tar --strip-components=1 -xz -C ${DEPS_DIR} || exit 1
CCACHE_URL="https://s3.amazonaws.com/mason-binaries/${OS_NAME}-x86_64/ccache/${CCACHE_VERSION}.tar.gz"
echo "Downloading ccache from ${CCACHE_URL} ..."
wget --quiet -O - ${CCACHE_URL} | tar --strip-components=1 -xz -C ${DEPS_DIR} || exit 1
# install clang for linux but use the xcode version on OSX
if [[ "${OS_NAME}" != "osx" ]]; then
    CLANG_URL="https://s3.amazonaws.com/mason-binaries/${OS_NAME}-x86_64/clang++/${CLANG_VERSION}.tar.gz"
    echo "Downloading clang from ${CLANG_URL} ..."
    wget --quiet -O - ${CLANG_URL} | tar --strip-components=1 -xz -C ${DEPS_DIR} || exit 1
    export CCOMPILER='clang'
    export CXXCOMPILER='clang++'
    export CC='clang'
    export CXX='clang++'
fi

if [[ "${OS_NAME}" == "osx" ]]; then
    if [[ -f /etc/sysctl.conf ]] && [[ $(grep shmmax /etc/sysctl.conf) ]]; then
        echo "Note: found shmmax setting in /etc/sysctl.conf, not modifying"
    else
        echo "WARNING: Did not find shmmax setting in /etc/sysctl.conf, adding now (requires sudo and restarting)..."
        sudo sysctl -w kern.sysv.shmmax=4294967296
        sudo sysctl -w kern.sysv.shmall=1048576
        sudo sysctl -w kern.sysv.shmseg=128
    fi
fi

# only set coverage flags for node-osrm to avoid
# very slow performance for osrm command line tools
if [[ ${COVERAGE} == true ]]; then
    export LDFLAGS="${LDFLAGS:-} --coverage" && export CXXFLAGS="${CXXFLAGS:-} --coverage"
fi

echo "Now build node-osrm and dependencies"
export VERBOSE=1
if [[ "${BUILD_TYPE}" == "Debug" ]]; then
    mapbox_time "make" make -j${JOBS} debug
elif [[ "${BUILD_TYPE}" == "Release" ]]; then
    mapbox_time "make" make -j${JOBS} release
else
    echo "Unknown build type ${BUILD_TYPE}"
    exit 1
fi

# run tests, with backtrace support
if [[ "${OS_NAME}" == "linux" ]]; then
    ulimit -c unlimited -S
    RESULT=0
    mapbox_time "make-test" make test || RESULT=$?
    for i in $(find ./ -maxdepth 1 -name 'core*' -print);
      do gdb $(which node) $i -ex "thread apply all bt" -ex "set pagination 0" -batch;
    done;
    if [[ ${RESULT} != 0 ]]; then exit $RESULT; fi
else
    # todo: coredump support on OS X
    mapbox_time "make-test" make test || RESULT=$?
    if [[ ${RESULT} != 0 ]]; then exit $RESULT; fi
fi


set +eu
set +o pipefail
