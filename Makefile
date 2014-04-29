all: osrm.node

./node_modules/.bin/node-gyp:
	npm install node-gyp
	npm install --build-from-source

./build: binding.gyp ./node_modules/.bin/node-gyp ./node_modules/.bin/node-pre-gyp
	./node_modules/.bin/node-gyp configure

osrm.node: Makefile ./build
	./node_modules/.bin/node-pre-gyp build

clean:
	@rm -rf ./build
	rm -rf lib/binding/
	rm -f *.osrm*

rebuild:
	@make clean
	@./configure
	@make

berlin-latest.osm.pbf:
	wget http://download.geofabrik.de/europe/germany/berlin-latest.osm.pbf

berlin-latest.osrm: berlin-latest.osm.pbf
	PATH="./lib/binding:${PATH}" && osrm-extract berlin-latest.osm.pbf -p test/data/car.lua

berlin-latest.osrm.hsgr: berlin-latest.osrm
	PATH="./lib/binding:${PATH}" && osrm-prepare berlin-latest.osrm -p test/data/car.lua

test: berlin-latest.osrm.hsgr
	npm test

check: test

.PHONY: test
