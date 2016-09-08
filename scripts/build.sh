#!/usr/bin/env bash

set -eu
set -o pipefail


# defaults
export TARGET=${TARGET:-Release}
export COVERAGE=${COVERAGE:-false}
export NODE=${NODE:-4}

export CURRENT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

source ${CURRENT_DIR}/travis_helper.sh

mapbox_time "setup-mason" source ${CURRENT_DIR}/setup_mason.sh
mapbox_time "setup-compiler" source ${CURRENT_DIR}/setup_compiler.sh

# ensure we start inside the root directory (one level up)
cd ${CURRENT_DIR}/../

if [[ ! $(which wget) ]]; then
    echo "echo wget must be installed";
    exit 1;
fi;

if [[ ! $(which pkg-config) ]]; then
    echo "echo pkg-config must be installed";
    exit 1;
fi;

if [[ "$(uname -s)" == "Darwin" ]]; then
    if [[ -f /etc/sysctl.conf ]] && [[ $(grep shmmax /etc/sysctl.conf) ]]; then
        echo "Note: found shmmax setting in /etc/sysctl.conf, not modifying"
    else
        echo "WARNING: Did not find shmmax setting in /etc/sysctl.conf, adding now (requires sudo and restarting)..."
        sudo sysctl -w kern.sysv.shmmax=4294967296
        sudo sysctl -w kern.sysv.shmall=1048576
        sudo sysctl -w kern.sysv.shmseg=128
        mapbox_time "brew" brew install md5sha1sum
    fi
fi

# install consistent node version
mapbox_time "install_node" source ./scripts/install_node.sh ${NODE}

if [[ ${TARGET} == 'Debug' ]]; then
    mapbox_time "bootstrap" export BUILD_TYPE=Debug && source ./bootstrap.sh
else
    mapbox_time "bootstrap" source ./bootstrap.sh
fi

# only set coverage flags for node-osrm to avoid
# very slow performance for osrm command line tools
if [[ ${COVERAGE} == true ]]; then
    export LDFLAGS="${LDFLAGS:-} --coverage" && export CXXFLAGS="${CXXFLAGS:-} --coverage"
fi

mapbox_time "npm-install" npm install --build-from-source ${NPM_FLAGS} --clang=1

# run tests, with backtrace support
if [[ "$(uname -s)" == "Linux" ]]; then
    ulimit -c unlimited -S
    RESULT=0
    mapbox_time "make-test" make test || RESULT=$?
    for i in $(find ./ -maxdepth 1 -name 'core*' -print);
      do gdb $(which node) $i -ex "thread apply all bt" -ex "set pagination 0" -batch;
    done;
    if [[ ${RESULT} != 0 ]]; then exit $RESULT; fi
else
    # todo: coredump support on OS X
    mapbox_time "make-test" make test
fi


set +eu
set +o pipefail