# MILVUS

## Run Milvus
run-milvus:
	cd milvus && docker compose -f docker-compose.yml up -d

## Stop Milvus
stop-milvus:
	cd milvus && docker compose -f docker-compose.yml down

# LLM MODEL

## Run LLM Model
run-llm-model:
	cd llm-model && docker compose -f docker-compose.yml up -d

## Stop LLM Model
stop-llm-model:
	cd llm-model && docker compose -f docker-compose.yml down

# PostgreSQL

## Run PostgreSQL
run-postgresql:
	cd postgresql && docker compose -f docker-compose.yml up -d

## Stop PostgreSQL
stop-postgresql:
	cd postgresql && docker compose -f docker-compose.yml down

# EMBEDDING MODEL

## Setup Embedding Model
setup-embedding-model:
	cd embedding-model && make setup

## Run Embedding Model
run-embedding-model:
	cd embedding-model && make up

## Stop Embedding Model
stop-embedding-model:
	cd embedding-model && make down

# VLM MODEL

## Run VLM Model
run-vlm-model:
	cd vlm-model && docker compose -f docker-compose.yml up -d

## Stop VLM Model
stop-vlm-model:
	cd vlm-model && docker compose -f docker-compose.yml down