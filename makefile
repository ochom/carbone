SHELL:=/bin/bash

dev:
	@echo "Starting development server..."
	@bun run dev

build:
	@echo "Building..."
	@bun run build

deploy:
	@echo "Starting development server..."
	@docker compose up

tidy:
	@echo "Tidying..."
	@bun install
