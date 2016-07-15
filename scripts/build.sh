#!/usr/bin/env bash

set -eu
set -o pipefail


# defaults
export TARGET=${TARGET:-Release}
export COVERAGE=${COVERAGE:-false}
export NODE=${NODE:-4}

export CURRENT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# ensure we start inside the root directory (one level up)
cd ${CURRENT_DIR}/../

if [[ $(which wget) ]]; then
    echo "Success: Found wget";
else
    echo "echo wget must be installed";
    exit 1;
fi;

if [[ $(which pkg-config) ]]; then
    echo "Success: Found pkg-config";
else
    echo "echo pkg-config must be installed";
    exit 1;
fi;

if [[ ${TARGET} == 'Debug' ]]; then
    export NPM_FLAGS="--debug"
else
    export NPM_FLAGS=""
fi

if [[ "$(uname -s)" == "Linux" ]]; then
    export PYTHONPATH=$(pwd)/mason_packages/.link/lib/python2.7/site-packages
elif [[ "$(uname -s)" == "Darwin" ]]; then
    if [[ -f /etc/sysctl.conf ]] && [[ $(grep shmmax /etc/sysctl.conf) ]]; then
        echo "Note: found shmmax setting in /etc/sysctl.conf, not modifying"
    else
        echo "WARNING: Did not find shmmax setting in /etc/sysctl.conf, adding now (requires sudo and restarting)..."
        sudo sysctl -w kern.sysv.shmmax=4294967296
        sudo sysctl -w kern.sysv.shmall=1048576
        sudo sysctl -w kern.sysv.shmseg=128
        export PYTHONPATH=$(pwd)/mason_packages/.link/lib/python/site-packages
        brew install md5sha1sum
    fi
fi

if [[ ${COVERAGE} == true ]]; then
    PYTHONUSERBASE=$(pwd)/mason_packages/.link pip install --user cpp-coveralls
fi

# install consistent node version
source ./scripts/install_node.sh ${NODE}

if [[ ${TARGET} == 'Debug' ]]; then
    export BUILD_TYPE=Debug && source ./bootstrap.sh
elif [[ ${COVERAGE} == true ]]; then
    export BUILD_TYPE=Debug && source ./bootstrap.sh
    export LDFLAGS="--coverage" && export CXXFLAGS="--coverage"
else
    source ./bootstrap.sh
fi

npm install --build-from-source ${NPM_FLAGS} --clang=1

# run tests, with backtrace support
if [[ "$(uname -s)" == "Linux" ]]; then
    ulimit -c unlimited -S
    RESULT=0
    make test || RESULT=$?
    for i in $(find ./ -maxdepth 1 -name 'core*' -print);
      do gdb $(which node) $i -ex "thread apply all bt" -ex "set pagination 0" -batch;
    done;
    if [[ ${RESULT} != 0 ]]; then exit $RESULT; fi
else
    # todo: coredump support on OS X
    make test
fi
