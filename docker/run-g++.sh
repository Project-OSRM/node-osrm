#!/usr/bin/env bash

set -e
set -o pipefail

docker run \
    -i \
    -e "CXX=g++" \
    -v `pwd`:/home/mapbox/node-osrm \
    -t mapbox/node-osrm:linux \
    node-osrm/docker/test.sh
