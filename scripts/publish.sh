COMMIT_MESSAGE=$(git show -s --format=%B $TRAVIS_COMMIT | tr -d '\n')
# put node-pre-gyp on path
export PATH=./node_modules/.bin/:$PATH
# now we publish the binary, if requested
PUBLISH_BINARY=false
if test "${COMMIT_MESSAGE#*'[publish binary]'}" != "$COMMIT_MESSAGE"; then echo PUBLISH_BINARY;PUBLISH_BINARY=true; fi;
# Note: this publishing is done here, in the 'script' section, instead of the 'after_success'
# since we want any failure here to stop the build immediately
if [[ $PUBLISH_BINARY == true ]]; then node-pre-gyp package publish; fi
# now clean up to prepare to re-install from remote binary
node-pre-gyp clean
# now install from published binary
# Note: we capture the error here so that if the install fails we can unpublish
INSTALL_RESULT=0
if [[ $PUBLISH_BINARY == true ]]; then INSTALL_RESULT=$(npm install --fallback-to-build=false > /dev/null)$? || true; fi
# if install returned non zero (errored) then we first unpublish and then call false so travis will bail at this line
if [[ $INSTALL_RESULT != 0 ]]; then echo "returned $INSTALL_RESULT";node-pre-gyp unpublish;false; fi
# If success then we arrive here so lets clean up
node-pre-gyp clean
