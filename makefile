SHELL:=/bin/bash

dev:
	@echo "Starting development server..."
	@npm run dev

build:
	@echo "Building..."
	@npm run build

deploy:
	@echo "Starting development server..."
	@docker compose up

tidy:
	@echo "Tidying..."
	@npm install
