#!/bin/bash
# scripts/build-nri-mysql.sh
set -e

# Clone nri-mysql repository
git clone https://github.com/newrelic/nri-mysql.git
cd nri-mysql

# Checkout specific branch or tag if needed
git checkout main

# Build the nri-mysql binary
go build -o nri-mysql

# Build Docker image
docker build -t nri-mysql:latest .

# Return to root directory
cd ..
