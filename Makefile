#http://www.gnu.org/prep/standards/html_node/Standard-Targets.html#Standard-Targets
TOOL_ROOT?=$(shell pwd)/lib/binding
OSRM_DATASTORE:=$(TOOL_ROOT)/osrm-datastore
export TOOL_ROOT
export OSRM_DATASTORE

all: build

pkgconfig:
	@if [[ `which pkg-config` ]]; then echo "Success: Found pkg-config"; else "echo you need pkg-config installed" && exit 1; fi;

./node_modules/node-pre-gyp:
	npm install node-pre-gyp

./node_modules: ./node_modules/node-pre-gyp
	source ./bootstrap.sh && npm install `node -e "console.log(Object.keys(require('./package.json').dependencies).join(' '))"` \
	`node -e "console.log(Object.keys(require('./package.json').devDependencies).join(' '))"` --clang=1

./build: pkgconfig ./node_modules
	source ./bootstrap.sh && ./node_modules/.bin/node-pre-gyp configure build --loglevel=error --clang=1

debug: pkgconfig ./node_modules
	export TARGET=Debug && source ./bootstrap.sh && ./node_modules/.bin/node-pre-gyp configure build --debug --clang=1

coverage: pkgconfig ./node_modules
	source ./bootstrap.sh && ./node_modules/.bin/node-pre-gyp configure build --debug --clang=1 --coverage=true

verbose: pkgconfig ./node_modules
	source ./bootstrap.sh && ./node_modules/.bin/node-pre-gyp configure build --loglevel=verbose --clang=1

clean:
	@rm -rf ./build
	rm -rf ./lib/binding/*
	rm -rf ./node_modules/
	rm -f ./*tgz
	rm -rf ./mason_packages
	rm -rf ./osrm-backend-*
	rm -rf ./deps

grind:
	valgrind --leak-check=full node node_modules/.bin/_mocha

shm: ./test/data/Makefile
	$(MAKE) -C ./test/data
	$(OSRM_DATASTORE) ./test/data/berlin-latest.osrm

test: shm
	npm test

.PHONY: test clean build shm
