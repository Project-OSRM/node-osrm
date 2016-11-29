OSRM_RELEASE:=$(shell node -e "console.log(require('../../package.json').osrm_release)")
OSRM_EXTRACT:=$(shell PATH="../../lib/binding:${PATH}" which osrm-extract)
OSRM_CONTRACT:=$(shell PATH="../../lib/binding:${PATH}" which osrm-contract)
CAR_PROFILE:=../../profiles/car.lua

ifeq ($(OSRM_RELEASE),)
$(error OSRM_RELEASE variable was not correct set)
endif

DATASET:=berlin-latest
DATASET_URL:=https://s3.amazonaws.com/mapbox/node-osrm/testing

all: $(DATASET).osrm.hsgr

%.osm.pbf:
	wget $(DATASET_URL)/$@ -O $@

%.osrm: %.osm.pbf $(CAR_PROFILE) $(OSRM_EXTRACT)
	@echo "Verifiyng data file integrity..."
	node md5sum.js -c data.md5sum
	$(OSRM_EXTRACT) $*.osm.pbf -p $(CAR_PROFILE)

%.osrm.hsgr: %.osrm $(OSRM_CONTRACT)
	$(OSRM_CONTRACT) $*.osrm

clean:
	rm -f ./berlin-latest.*

checksum: $(DATASET).osm.pbf
	node md5sum.js $^ > data.md5sum

.PHONY: clean checksum
