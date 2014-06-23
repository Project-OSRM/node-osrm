#!/bin/bash

if [[ `uname -s` == 'Linux' ]]; then
   export LDFLAGS="-Wl,-z,origin -Wl,-rpath=\$$ORIGIN/tbb/ ${LDFLAGS}"
fi

function move_tool() {
    cp `which $1` "./lib/binding/"
    if [[ `uname -s` == 'Darwin' ]]; then
        install_name_tool -change libtbb.dylib @loader_path/tbb/libtbb.dylib ./lib/binding/$1
        install_name_tool -change libtbbmalloc.dylib @loader_path/tbb/libtbbmalloc.dylib ./lib/binding/$1
    fi
}

function copy_tbb() {
    mkdir -p ./lib/binding/tbb/
    cp ${BUILD}/lib/libtbb{*so*,*dylib*} ./lib/binding/tbb/
    cp ${BUILD}/lib/libtbbmalloc{*so*,*dylib*} ./lib/binding/tbb/
}

function localize() {
    copy_tbb
    cp `which lua` "./lib/binding/"
    move_tool osrm-extract
    move_tool osrm-datastore
    move_tool osrm-prepare
}

export -f localize
