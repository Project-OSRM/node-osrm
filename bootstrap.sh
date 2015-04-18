#!/bin/bash

function dep() {
    ~/.mason/mason install $1 $2
    ~/.mason/mason link $1 $2
}

function all_deps() {
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
    dep osmpbf 1.3.3 &
    dep protobuf 2.6.1 &
    dep bzip 1.0.6 &
    dep zlib system &
    dep tbb 43_20150316 &
    wait
}

function move_tool() {
    cp ${MASON_HOME}/bin/$1 "${TARGET_DIR}/"
    if [[ `uname -s` == 'Darwin' ]]; then
        install_name_tool -change libtbb.dylib @loader_path/libtbb.dylib ${TARGET_DIR}/$1
        install_name_tool -change libtbbmalloc.dylib @loader_path/libtbbmalloc.dylib ${TARGET_DIR}/$1
    fi
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

function main() {
    if [[ ! -d ~/.mason ]]; then
        git clone --depth 1 https://github.com/mapbox/mason.git ~/.mason
    fi
    ~/.mason/mason install cmake 3.2.2;
    all_deps
    if [[ `uname -s` == 'Darwin' ]]; then
        brew install pkg-config || true
    fi
    export PATH=$(~/.mason/mason prefix cmake 3.2.2)/bin:$PATH;
    export MASON_HOME=$(pwd)/mason_packages/.link
    export PKG_CONFIG_PATH=${MASON_HOME}/lib/pkgconfig

    if [[ ! -d ./node_modules/node-pre-gyp ]]; then
        npm install node-pre-gyp
    fi

    export TARGET_DIR=$(./node_modules/.bin/node-pre-gyp reveal module_path --silent)

    LINK_FLAGS=""
    LDFLAGS=""
    if [[ $(uname -s) == 'Linux' ]]; then
        LINK_FLAGS="${LINK_FLAGS} "'-Wl,-z,origin -Wl,-rpath=\$ORIGIN'
        export LDFLAGS="${LINK_FLAGS}"
        source ~/.mason/scripts/setup_cpp11_toolchain.sh
    fi

    if [[ ! -d ./osrm-backend ]] || [[ ! -f ${MASON_HOME}/bin/osrm-extract ]]; then
        if [[ "${OSRM_RELEASE:-false}" == false ]]; then
            OSRM_RELEASE=.
        fi

        if [[ "${OSRM_REPO:-false}" == false ]]; then
            OSRM_REPO="https://github.com/Project-OSRM/osrm-backend.git"
        fi

        git clone ${OSRM_REPO}
        cd osrm-backend
        git checkout ${OSRM_RELEASE}


        rm -rf build
        mkdir -p build
        cd build
        cmake ../ -DCMAKE_INSTALL_PREFIX=${MASON_HOME} \
          -DCMAKE_CXX_COMPILER="$CXX" \
          -DBoost_NO_SYSTEM_PATHS=ON \
          -DTBB_INSTALL_DIR=${MASON_HOME} \
          -DCMAKE_INCLUDE_PATH=${MASON_HOME}/include \
          -DCMAKE_LIBRARY_PATH=${MASON_HOME}/lib \
          -DCMAKE_BUILD_TYPE=Release \
          -DCMAKE_EXE_LINKER_FLAGS="${LINK_FLAGS}"
        make -j${JOBS}
        make install

        cd ../../
    fi

    localize

    #if [[ `uname -s` == 'Darwin' ]]; then otool -L ./lib/binding/* || true; fi
    #if [[ `uname -s` == 'Linux' ]]; then readelf -d ./lib/binding/* || true; fi
    echo "success: now run 'npm install --build-from-source'"

}

main