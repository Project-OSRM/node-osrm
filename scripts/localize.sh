#!/bin/bash

if [[ `uname -s` == 'Linux' ]]; then
   export LDFLAGS='-Wl,-z,origin -Wl,-rpath=\$$ORIGIN'
fi

function move_tool() {
    cp `which $1` "./lib/binding/"
    if [[ `uname -s` == 'Darwin' ]]; then
        install_name_tool -change libtbb.dylib @loader_path/libtbb.dylib ./lib/binding/$1
        install_name_tool -change libtbbmalloc.dylib @loader_path/libtbbmalloc.dylib ./lib/binding/$1
    fi
}

function copy_tbb() {
    mkdir -p ./lib/binding/tbb/
    if [[ `uname -s` == 'Darwin' ]]; then
        cp ${BUILD}/lib/libtbb.dylib ./lib/binding/
        cp ${BUILD}/lib/libtbbmalloc.dylib ./lib/binding/
    else
        cp ${BUILD}/lib/libtbb.so.2 ./lib/binding/
        cp ${BUILD}/lib/libtbbmalloc.so.2 ./lib/binding/
        cp ${BUILD}/lib/libtbbmalloc_proxy.so.2 ./lib/binding/
    fi
}

function localize() {
    copy_tbb
    cp `which lua` "./lib/binding/"
    move_tool osrm-extract
    move_tool osrm-datastore
    move_tool osrm-prepare
}

export -f localize
