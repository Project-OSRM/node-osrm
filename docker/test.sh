#!/usr/bin/env bash

set -e
set -o pipefail


cd /home/mapbox/node-osrm
source ./scripts/install_node.sh 5
. ./bootstrap.sh
npm install --build-from-source

make test -j`nproc`
