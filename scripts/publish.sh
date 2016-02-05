#!/bin/bash

./node_modules/.bin/node-pre-gyp package ${NPM_FLAGS}

COMMIT_MESSAGE=$(git log --format=%B --no-merges | head -n 1 | tr -d '\n')
echo "Commit message: ${COMMIT_MESSAGE}"

if [[ ${COMMIT_MESSAGE} =~ "[publish binary]" ]]; then
    echo "Publishing"
    ./node_modules/.bin/node-pre-gyp publish ${NPM_FLAGS}
elif [[ ${COMMIT_MESSAGE} =~ "[republish binary]" ]]; then
    echo "Re-Publishing"
    ./node_modules/.bin/node-pre-gyp unpublish publish ${NPM_FLAGS}
else
    echo "Skipping publishing"
fi;
