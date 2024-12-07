#!/bin/bash
set -e

# Log function
log_info() {
    local message="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[INFO] [$timestamp] $message"
}

log_error() {
    local message="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[ERROR] [$timestamp] $message" >&2
}

# Validate environment variables
validate_env_vars() {
    local required_vars=('MYSQL_ROOT_PASSWORD')
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            log_error "Missing required environment variable: $var"
            exit 1
        fi
    done
}

# Main execution
main() {
    validate_env_vars

    log_info "Starting MySQL server..."
    # Use the official MySQL docker-entrypoint.sh script
    exec docker-entrypoint.sh "$@"
}

main "$@"
