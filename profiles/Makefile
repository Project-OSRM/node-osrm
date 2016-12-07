OSRM_RELEASE := $(shell node -e "console.log(require('../package.json').osrm_release)")

ifeq ($(OSRM_RELEASE),)
$(error OSRM_RELEASE variable was not correct set)
endif

PROFILES_URL:=https://raw.githubusercontent.com/Project-OSRM/osrm-backend/$(OSRM_RELEASE)/profiles

all: car.lua bicycle.lua foot.lua lib/access.lua lib/destination.lua lib/guidance.lua lib/set.lua lib/sequence.lua lib/directional.lua

./lib:
	mkdir -p lib

%.lua: ./lib
	wget $(PROFILES_URL)/$@ -O $@

clean:
	rm -f *.lua
	rm -rf ./lib

.PHONY: clean
