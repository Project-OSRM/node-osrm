#!/bin/bash

set -eu
set -o pipefail

if [[ $(uname -s) == 'Linux' ]]; then
    mason install clang 3.8.0
    export PATH=$(mason prefix clang 3.8.0)/bin:${PATH}
    which clang++
fi