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
	cd ../Project-OSRM/ && ./build/osrm-extract ../node-OSRM/berlin-latest.osm.pbf

berlin-latest.osrm.hsgr: berlin-latest.osrm
	echo '2000-00-00T00:00:00Z' > berlin-latest.osrm.timestamp
	cd ../Project-OSRM/ && ./build/osrm-prepare ../node-OSRM/berlin-latest.osrm

test: berlin-latest.osrm.hsgr
	@export NODE_PATH=./lib && npm test

check: test

.PHONY: test
