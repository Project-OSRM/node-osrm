#!/usr/bin/env bash

set -e
set -o pipefail

docker build \
    -t mapbox/node-osrm:linux \
    docker/

