#!/bin/bash
# scripts/deploy-local.sh

# Ensure .env is loaded
if [ ! -f .env ]; then
    echo ".env file not found!"
    exit 1
fi

export $(grep -v '^#' .env | xargs)

# Build and run Docker Compose
docker-compose up -d --build

# Wait for MySQL to initialize
echo "Waiting for MySQL to initialize..."
sleep 30

# Populate additional data if needed
# Uncomment the following lines if you want to run bulk_insert.py automatically
# docker exec -i mysql-newrelic python /scripts/bulk_insert.py
