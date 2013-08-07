all: osrm.node

osrm.node:
	node-gyp --verbose build

clean:
	@rm -rf ./build
	rm -f lib/_osrm.node

rebuild:
	@make clean
	@./configure
	@make

berlin-latest.osm.pbf:
	wget http://download.geofabrik.de/europe/germany/berlin-latest.osm.pbf

berlin-latest.osrm: berlin-latest.osm.pbf
	cd ../ && ./build/osrm-extract node-osrm/berlin-latest.osm.pbf

berlin-latest.osrm.hsgr: berlin-latest.osrm
	echo '2000-00-00T00:00:00Z' > berlin-latest.osrm.timestamp
	cd ../ && ./build/osrm-prepare node-osrm/berlin-latest.osrm node-osrm/berlin-latest.osrm.restrictions

test: berlin-latest.osrm.hsgr
	export NODE_PATH=./lib && npm test

check: test

.PHONY: test
