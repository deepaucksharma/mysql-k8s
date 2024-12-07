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

# Error handling
handle_error() {
    local line_number="$1"
    local command="$2"
    log_error "Error occurred in line $line_number: $command"
    exit 1
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

# Prepare data directory
prepare_data_directory() {
    log_info "Preparing MySQL data directory..."
    mkdir -p /var/lib/mysql /var/log/mysql
    chown -R mysql:mysql /var/lib/mysql /var/log/mysql
    chmod 755 /var/lib/mysql /var/log/mysql

    if [[ ! -d /var/lib/mysql/mysql ]]; then
        log_info "Initializing MySQL data directory..."
        mysqld --initialize-insecure --user=mysql
    fi
}

# Main execution
main() {
    trap 'handle_error $LINENO "$BASH_COMMAND"' ERR

    validate_env_vars
    prepare_data_directory

    log_info "Starting MySQL server..."
    exec mysqld --user=mysql \
        --log-error=/var/log/mysql/mysqld.log \
        --general-log=1 \
        --general-log-file=/var/log/mysql/mysqld-general.log \
        --bind-address=0.0.0.0 \
        --mysqlx-bind-address=0.0.0.0
}

main "$@"
