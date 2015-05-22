
./node_modules/.bin/node-pre-gyp package ${NPM_FLAGS}

COMMIT_MESSAGE=$(git show -s --format=%B $TRAVIS_COMMIT | tr -d '\n')

if [[ ${COMMIT_MESSAGE} =~ "[publish binary]" ]]; then
    ./node_modules/.bin/node-pre-gyp publish ${NPM_FLAGS}
elif [[ ${COMMIT_MESSAGE} =~ "[republish binary]" ]]; then
    ./node_modules/.bin/node-pre-gyp unpublish publish ${NPM_FLAGS}
fi;
