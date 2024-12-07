#!/bin/bash
# scripts/reset-local.sh

# Stop and remove containers, volumes
docker-compose down -v
