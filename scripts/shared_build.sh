#!/bin/bash

UNAME=$(uname -s);
if [ ${UNAME} = 'Darwin' ]; then
    brew install boost cmake protobuf libstxxl luaosm-pbf
    DEPS_PREFIX=$(brew --prefix)
    # install luabind
    git clone --depth=1 https://github.com/DennisOSRM/luabind.git
    cd luabind
    mkdir -p build
    cd build
    cmake ../ -DCMAKE_BUILD_TYPE=Release -DCMAKE_INSTALL_PREFIX=${DEPS_PREFIX}
    make
    make install
    cd ../../

else
    # install packages
    sudo apt-add-repository --yes ppa:mapnik/boost # boost 1.49 (in future 1.55)
    sudo apt-get -qq update
    sudo apt-get install -y libboost-filesystem-dev libboost-program-options-dev libboost-iostreams-dev libboost-regex-dev libboost-system-dev libboost-thread-dev
    sudo apt-get install -y build-essential git cmake libprotoc-dev libprotobuf7 protobuf-compiler libprotobuf-dev libbz2-dev libstxxl-dev libstxxl-doc libstxxl1 libxml2-dev libzip-dev lua5.1 liblua5.1-0-dev
    DEPS_PREFIX="/usr/local"

    # install osmpbf
    git clone --depth=1 https://github.com/scrosby/OSM-binary.git
    cd OSM-binary/src
    make
    sudo make install
    cd ../../

fi

# install OSRM
git clone --depth=1 https://github.com/DennisOSRM/Project-OSRM.git Project-OSRM -b develop
cd Project-OSRM
# https://github.com/DennisOSRM/Project-OSRM/issues/1000
echo '
--- Algorithms/DouglasPeucker.cpp   2014-05-01 12:45:44.000000000 -0700
+++ Algorithms/DouglasPeucker.cpp  2014-05-01 12:45:41.000000000 -0700
@@ -99,7 +99,7 @@
                 input_geometry[i].location,
                 input_geometry[pair.first].location,
                 input_geometry[pair.second].location);
-            const double distance = std::abs(temp_dist);
+            const double distance = std::fabs(temp_dist);
             if (distance > DouglasPeuckerThresholds[zoom_level] && distance > max_distance)
             {
                 farthest_element_index = i;
' > abs-patch.diff
patch -N Algorithms/DouglasPeucker.cpp ./abs-patch.diff || true
mkdir -p build
cd build
cmake ../ \
  -DCMAKE_INCLUDE_PATH=${DEPS_PREFIX}/include \
  -DCMAKE_LIBRARY_PATH=${DEPS_PREFIX}/lib \
  -DCMAKE_BUILD_TYPE=Release

make VERBOSE=1
make install
cd ../../