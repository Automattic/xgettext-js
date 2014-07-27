test:
	./node_modules/.bin/mocha

test-watch:
	./node_modules/.bin/mocha --watch

.PHONY: test test-watch