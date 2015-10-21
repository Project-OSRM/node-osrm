#http://www.gnu.org/prep/standards/html_node/Standard-Targets.html#Standard-Targets

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
	rm -rf ./lib/binding/
	rm -rf ./node_modules/
	rm -f ./*tgz
	rm -f ./*.osrm*
	rm -rf ./mason_packages
	rm -rf ./osrm-backend-*

grind:
	valgrind --leak-check=full node node_modules/.bin/_mocha

testpack:
	rm -f ./*tgz
	npm pack
	tar -ztvf *tgz
	rm -f ./*tgz

rebuild:
	@make clean
	@make

berlin-latest.osm.pbf:
	wget http://download.geofabrik.de/europe/germany/berlin-latest.osm.pbf

berlin-latest.osrm: berlin-latest.osm.pbf
	./lib/binding/osrm-extract berlin-latest.osm.pbf -p test/data/car.lua

berlin-latest.osrm.hsgr: berlin-latest.osrm
	./lib/binding/osrm-prepare berlin-latest.osrm -p test/data/car.lua && \
    ./lib/binding/osrm-datastore berlin-latest.osrm

test: berlin-latest.osrm.hsgr
	./node_modules/.bin/mocha -R spec

.PHONY: clean build
