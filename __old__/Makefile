SRC= ./src/Restesque.js
TEST= ./test/Router.test.js

# Color for make file
# Reference: http://jamesdolan.blogspot.co.uk/2009/10/color-coding-makefile-output.html
# Usage: @echo "$(OK_COLOR) Creating documentation $(NO_COLOR)" 
NO_COLOR=\x1b[0m
OK_COLOR=\x1b[32;01m
ERROR_COLOR=\x1b[31;01m
WARN_COLOR=\x1b[33;01m
# Usage: @echo "$(OK_STRING) Lorem" 
OK_STRING=$(OK_COLOR)[OK]$(NO_COLOR)
ERROR_STRING=$(ERROR_COLOR)[ERRORS]$(NO_COLOR)
WARN_STRING=$(WARN_COLOR)[WARNINGS]$(NO_COLOR)

# Builds the documentation and puts it into docs
# # Get the last updated file
LAST_TOUCHED_SRC= $(shell ls -1t $(SRC) | head -1)
LAST_TOUCHED_SRC_FILENAME= $(shell basename $(LAST_TOUCHED_SRC) .js)


all: $(SRC)

build: test docs

test: all 
	mocha -R doc | cat docs/head.html - docs/tail.html > docs/test.html

test-watch: all
	mocha -w

docs: all
	@echo "$(WARN_COLOR) --- Creating documentation  ---$(NO_COLOR)" 
	@docco -l classic -o docs $(SRC)
	@echo "$(OK_STRING) Documention created. Run \"make opendocs\" to view\n"

opendocs:
		@echo "$(WARN_COLOR) --- Opening docs file with google chrome---$(NO_COLOR)" 
		@echo "Last touched file $(LATEST_FILE)"
		@open -a "Google Chrome" docs/$(LAST_TOUCHED_SRC_FILENAME).html 

.PHONY: all