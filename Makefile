all: osrm.node

./node_modules:
	npm install --build-from-source

osrm.node: ./node_modules
	./node_modules/.bin/node-pre-gyp build --loglevel=silent

debug:
	./node_modules/.bin/node-pre-gyp rebuild --debug

verbose:
	./node_modules/.bin/node-pre-gyp rebuild --loglevel=verbose

clean:
	@rm -rf ./build
	rm -rf ./lib/binding/
	rm -rf ./node_modules
	rm -f *.osrm*

rebuild:
	@make clean
	@make

berlin-latest.osm.pbf:
	wget http://download.geofabrik.de/europe/germany/berlin-latest.osm.pbf

berlin-latest.osrm: berlin-latest.osm.pbf
	PATH="./lib/binding:${PATH}" && osrm-extract berlin-latest.osm.pbf -p test/data/car.lua

berlin-latest.osrm.hsgr: berlin-latest.osrm
	PATH="./lib/binding:${PATH}" && osrm-prepare berlin-latest.osrm -p test/data/car.lua

test: berlin-latest.osrm.hsgr
	PATH="./lib/binding:${PATH}" && osrm-datastore berlin-latest.osrm
	npm test

check: test

.PHONY: test
