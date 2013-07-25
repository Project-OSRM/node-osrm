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

test:
	export NODE_PATH=./lib && npm test

check: test

.PHONY: test
