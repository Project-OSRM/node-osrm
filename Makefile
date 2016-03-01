# http://www.gnu.org/prep/standards/html_node/Standard-Targets.html#Standard-Targets

all: build

pkgconfig:
	@if [[ `which pkg-config` ]]; then echo "Success: Found pkg-config"; else "echo you need pkg-config installed" && exit 1; fi;

./osrm-settings.env:
	./bootstrap.sh

./node_modules/nan:
	npm install `node -e "console.log(Object.keys(require('./package.json').dependencies).join(' '))"` \
	`node -e "console.log(Object.keys(require('./package.json').devDependencies).join(' '))"` --clang=1

./node_modules: ./node_modules/nan
	npm install node-pre-gyp

./build: pkgconfig ./node_modules
	./node_modules/.bin/node-pre-gyp configure build --loglevel=error --clang=1

debug: pkgconfig ./node_modules ./osrm-settings.env
	export TARGET=Debug && ./bootstrap.sh && ./node_modules/.bin/node-pre-gyp configure build --debug --clang=1

coverage: pkgconfig ./node_modules ./osrm-settings.env
	./node_modules/.bin/node-pre-gyp configure build --debug --clang=1 --coverage=true

verbose: pkgconfig ./node_modules ./osrm-settings.env
	./node_modules/.bin/node-pre-gyp configure build --loglevel=verbose --clang=1

clean:
	(cd test/data/ && $(MAKE) clean)
	rm -rf ./build
	rm -rf ./lib/binding/*
	rm -rf ./node_modules/
	rm -f ./*tgz
	rm -rf ./mason_packages
	rm -rf ./osrm-backend-*
	rm -rf ./deps

grind:
	valgrind --leak-check=full node node_modules/.bin/_mocha

shm: ./test/data/Makefile
	PATH="./lib/binding:${PATH}" && $(MAKE) -C ./test/data
	PATH="./lib/binding:${PATH}" && osrm-datastore ./test/data/berlin-latest.osrm

test: shm
	npm test

.PHONY: test clean build shm
