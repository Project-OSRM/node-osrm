# If JOBS environment variable not defined, default to the number of CPUs available
ifeq ($(JOBS),)
JOBS:=1
OS:=$(shell uname -s)
ifeq ($(OS),Linux)
  JOBS:=$(shell grep -c ^processor /proc/cpuinfo)
endif
ifeq ($(OS),Darwin) # Assume Mac OS X
  JOBS:=$(shell sysctl -n hw.ncpu)
endif
endif

all: release

node_modules: package.json
	npm install --ignore-scripts # Install dependencies but don't run our own install script.

# build the node module and libosrm using cmake
build/%/osrm.node: ./node_modules
	mkdir -p build &&\
	 cd build &&\
	 cmake .. -DCMAKE_BUILD_TYPE=$* -DBUILD_LIBOSRM=On &&\
	 VERBOSE=1 make -j${JOBS} &&\
	 cd ..

release: build/Release/osrm.node

debug: build/Debug/osrm.node

clean:
	(cd test/data/ && $(MAKE) clean)
	rm -rf ./build
	rm -rf ./lib/binding/*
	rm -rf ./node_modules/
	rm -f ./*tgz
	rm -rf ./deps/

grind:
	valgrind --leak-check=full node node_modules/.bin/_mocha

# Note: this PATH setting is used to allow the localized tools to be used
# but your locally installed osrm-backend tool, if on PATH should override
shm: ./test/data/Makefile
	@PATH="$(PATH):./lib/binding" && echo "*** Using osrm-datastore from `which osrm-datastore` ***"
	$(MAKE) -C ./test/data
	PATH="$(PATH):./lib/binding" && osrm-datastore ./test/data/berlin-latest.osrm

test: shm
	npm test

.PHONY: test clean build shm debug release
