#!/bin/bash

if [[ `uname -s` == 'Linux' ]]; then
   export LDFLAGS='-Wl,-z,origin -Wl,-rpath=\$$ORIGIN'
fi

npm install node-pre-gyp
TARGET_DIR=$(./node_modules/.bin/node-pre-gyp reveal module_path --silent)

function move_tool() {
    cp `which $1` "$TARGET_DIR/"
    if [[ `uname -s` == 'Darwin' ]]; then
        install_name_tool -change libtbb.dylib @loader_path/libtbb.dylib $TARGET_DIR/$1
        install_name_tool -change libtbbmalloc.dylib @loader_path/libtbbmalloc.dylib $TARGET_DIR/$1
    fi
}

function copy_tbb() {
    mkdir -p $TARGET_DIR/tbb/
    if [[ `uname -s` == 'Darwin' ]]; then
        cp ${BUILD}/lib/libtbb.dylib $TARGET_DIR/
        cp ${BUILD}/lib/libtbbmalloc.dylib $TARGET_DIR/
    else
        cp ${BUILD}/lib/libtbb.so.2 $TARGET_DIR/
        cp ${BUILD}/lib/libtbbmalloc.so.2 $TARGET_DIR/
        cp ${BUILD}/lib/libtbbmalloc_proxy.so.2 $TARGET_DIR/
    fi
}

function localize() {
    copy_tbb
    cp ${BUILD}/bin/lua $TARGET_DIR
    move_tool osrm-extract
    move_tool osrm-datastore
    move_tool osrm-prepare
}

export -f localize
