#!/bin/bash

# Script to clone bge-ma012 repository and run docker-compose
# If the repository already exists, skip cloning and proceed to docker-compose

REPO_URL="git@github.com:CITI-KnowledgeManagementSystem/bge-ma012.git"
REPO_DIR="bge-ma012"

echo "Setting up embedding-model..."

# Check if the repository directory already exists
if [ -d "$REPO_DIR" ]; then
    echo "Repository '$REPO_DIR' already exists. Skipping clone..."
else
    echo "Cloning repository from $REPO_URL..."
    git clone "$REPO_URL"
    
    if [ $? -ne 0 ]; then
        echo "Error: Failed to clone repository"
        exit 1
    fi
    
    echo "Repository cloned successfully"
fi

# Navigate to the repository directory
cd "$REPO_DIR" || exit 1

# Check if docker-compose.yml exists
if [ ! -f "docker-compose.yml" ]; then
    echo "Warning: docker-compose.yml not found in $REPO_DIR"
    exit 1
fi
