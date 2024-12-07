#!/bin/bash
# deploy-local.sh - Deploys the local development environment
set -e

# Function to log messages
log() {
    echo -e "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Function to check service health
check_health() {
    local service=$1
    local port=$2
    local max_attempts=$3
    local attempt=1

    log "Waiting for $service to be healthy..."
    while [ $attempt -le $max_attempts ]; do
        if curl -s http://localhost:$port/health &> /dev/null; then
            log "✓ $service is healthy"
            return 0
        fi
        log "Attempt $attempt/$max_attempts..."
        sleep 5
        ((attempt++))
    done
    return 1
}

# Main deployment process
main() {
    # Verify environment
    if [ ! -f .env ]; then
        log "Error: .env file not found. Run setup-dev-env.ps1 first."
        exit 1
    fi

    # Load environment variables
    set -a
    source .env
    set +a

    # Deploy services
    log "Deploying services..."
    docker-compose down --remove-orphans
    docker-compose pull
    docker-compose up -d --build

    # Wait for services
    log "Waiting for services to be ready..."
    if ! check_health "MySQL" 3306 12; then
        log "Error: MySQL failed to start"
        docker-compose logs mysql
        exit 1
    fi

    if ! check_health "API" 3000 12; then
        log "Error: API failed to start"
        docker-compose logs api
        exit 1
    fi

    # Show status
    log "Deployment complete! Services:"
    docker-compose ps
    
    log "
Service URLs:
  API:        http://localhost:3000
  Metrics:    http://localhost:8080
  New Relic:  https://one.newrelic.com
"
}

# Handle interrupts
trap 'log "Interrupted, cleaning up..."; docker-compose down' INT

# Run deployment
main
