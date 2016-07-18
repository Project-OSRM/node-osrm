# http://www.gnu.org/prep/standards/html_node/Standard-Targets.html#Standard-Targets

all: build/Release/osrm.node

# osrm-backend provides libosrm.pc for use with
# pkg-config and the node-osrm build (via binding.gyp)
# calls out to pkg-config to figure out details of the
# osrm-backend install. So, here we stop builds quickly
# if pkg-config is not found.
ifeq (, $(shell which pkg-config))
 $(error "No pkg-config found: please ensure you have pkg-config installed")
endif

# Build osrm-backend in release mode
# locally in the deps/ directory using
# mason dependencies. The goal here is
# to have a portable build that can be
# packaged and published for all Linux
# and OS X users
./deps/osrm-backend-Release:
	./bootstrap.sh

# Build osrm-backend in debug mode
./deps/osrm-backend-Debug:
	export BUILD_TYPE=Debug && ./bootstrap.sh

# This target (all the way down to the verbose target) use a customized
# way of installing that is roughly equivalent to just running
# "npm install" but faster for rebuilds. The idea is to allow you to
# make changes to src/node-osrm.cpp and then retype "make" in order to
# iterate quickly.

# Install all dependencies and devDependencies
# without actually triggering a node-osrm compile
# TODO: there should be a cleaner way to do this?
# Note: the `--clang` is harmless when building with gcc
# but removes known compiler flags that break with clang
./node_modules:
	npm install `node -e "console.log(Object.keys(require('./package.json').dependencies).join(' '))"` \
	`node -e "console.log(Object.keys(require('./package.json').devDependencies).join(' '))"` --clang=1 --gypjs

# put the local osrm-backend on PKG_CONFIG_PATH, show the developer that
# the local version is being used by default, and build using node-pre-gyp
# directly (this is more direct than "npm install" which just calls node-pre-gyp anyway)
# We use "--loglevel=error" to quiet the verbosity to make it easier to see compiler errors quickly
build/Release/osrm.node: ./node_modules ./deps/osrm-backend-Release
	@export PKG_CONFIG_PATH="mason_packages/.link/lib/pkgconfig" && \
	  echo "*** Using osrm installed at `pkg-config libosrm --variable=prefix` ***" && \
	  ./node_modules/.bin/node-pre-gyp configure build --loglevel=error --clang=1 --gypjs $(NPM_FLAGS)

# put the local debug-built osrm-backend on PKG_CONFIG_PATH and build as normal
debug: ./node_modules ./deps/osrm-backend-Debug
	@export PKG_CONFIG_PATH="mason_packages/.link/lib/pkgconfig" && \
	  echo "*** Using osrm installed at `pkg-config libosrm --variable=prefix` ***" && \
	  ./node_modules/.bin/node-pre-gyp configure build --debug --clang=1 --gypjs $(NPM_FLAGS)

coverage: ./node_modules ./deps/osrm-backend-Debug
	@export PKG_CONFIG_PATH="mason_packages/.link/lib/pkgconfig" && \
	  export LDFLAGS="--coverage" && export CXXFLAGS="--coverage" && \
	  echo "*** Using osrm installed at `pkg-config libosrm --variable=prefix` ***" && \
	  ./node_modules/.bin/node-pre-gyp configure build --debug --clang=1 --gypjs $(NPM_FLAGS)

# same as typing "make" (which hits the "build/Release/osrm.node" target) except that
# "--loglevel=verbose" shows the actual compiler arguments
verbose: ./node_modules ./deps/osrm-backend-Release
	@export PKG_CONFIG_PATH="mason_packages/.link/lib/pkgconfig" && \
	  echo "*** Using osrm installed at `pkg-config libosrm --variable=prefix` ***" && \
	  ./node_modules/.bin/node-pre-gyp configure build --loglevel=verbose --clang=1 --gypjs $(NPM_FLAGS)

clean:
	(cd test/data/ && $(MAKE) clean)
	rm -rf ./build
	rm -rf ./lib/binding/*
	rm -rf ./node_modules/
	rm -f ./*tgz
	rm -rf ./mason_packages
	rm -rf ./deps

grind:
	valgrind --leak-check=full node node_modules/.bin/_mocha

# Note: this PATH setting is used to allow the localized tools to be used
# but your locally installed osrm-backend tool, if on PATH should override
shm: ./test/data/Makefile
	@PATH="${PATH}:./lib/binding" && echo "*** Using osrm-datastore from `which osrm-datastore` ***"
	@PATH="${PATH}:./lib/binding" && $(MAKE) -C ./test/data
	@PATH="${PATH}:./lib/binding" && osrm-datastore ./test/data/berlin-latest.osrm

test: shm
	npm test

.PHONY: test clean build shm
