SHELL:=/bin/bash

dev:
	@echo "Starting development server..."
	@docker compose up

build:
	@echo "Building..."
	@npm run build

