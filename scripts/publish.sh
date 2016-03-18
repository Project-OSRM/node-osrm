#!/bin/bash

if [[ $(./scripts/is_pr_merge.sh) ]]; then
    echo "Skipping publishing because this is a PR merge commit"
else
    ./node_modules/.bin/node-pre-gyp package

    COMMIT_MESSAGE=$(git log --format=%B --no-merges | head -n 1 | tr -d '\n')
    echo "Commit message: ${COMMIT_MESSAGE}"

    if [[ ${COMMIT_MESSAGE} =~ "[publish binary]" ]]; then
        echo "Publishing"
        ./node_modules/.bin/node-pre-gyp publish
    elif [[ ${COMMIT_MESSAGE} =~ "[republish binary]" ]]; then
        echo "Re-Publishing"
        ./node_modules/.bin/node-pre-gyp unpublish publish
    else
        echo "Skipping publishing"
    fi;
fi
