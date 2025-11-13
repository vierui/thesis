.PHONY: setup up down

REPO_DIR = bge-ma012

setup:
	@bash setup.sh

up:
	@if [ -d "$(REPO_DIR)" ]; then \
		cd $(REPO_DIR) && docker compose up -d; \
	else \
		echo "Error: Repository not found. Run 'make setup' first."; \
		exit 1; \
	fi

down:
	@if [ -d "$(REPO_DIR)" ]; then \
		cd $(REPO_DIR) && docker compose down; \
	else \
		echo "Warning: Repository not found."; \
	fi