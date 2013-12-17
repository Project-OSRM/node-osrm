all: osrm.node

./build: binding.gyp
	`npm explore npm -g -- pwd`/bin/node-gyp-bin/node-gyp configure

osrm.node: Makefile ./build
	`npm explore npm -g -- pwd`/bin/node-gyp-bin/node-gyp build

clean:
	@rm -rf ./build
	rm -f lib/_osrm.node
	rm -f *.osrm*

rebuild:
	@make clean
	@./configure
	@make

berlin-latest.osm.pbf:
	wget http://download.geofabrik.de/europe/germany/berlin-latest.osm.pbf

berlin-latest.osrm: berlin-latest.osm.pbf
	osrm-extract berlin-latest.osm.pbf -p test/data/car.lua

berlin-latest.osrm.hsgr: berlin-latest.osrm
	osrm-prepare berlin-latest.osrm

test: berlin-latest.osrm.hsgr
	npm test

check: test

.PHONY: test
