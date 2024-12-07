#!/bin/bash
set -o pipefail  # Ensure pipe failures are captured
set -e           # Exit immediately on error
set -x           # Print commands and their arguments as they are executed

# Enhanced logging functions
log_error() {
    local message="$1"
    local timestamp=$(date "+%Y-%m-%d %H:%M:%S")
    echo "[ERROR] [$timestamp] $message" >&2
    # Optional: Log to syslog if needed
    # logger -p error -t mysql-entrypoint "$message"
}

log_warning() {
    local message="$1"
    local timestamp=$(date "+%Y-%m-%d %H:%M:%S")
    echo "[WARNING] [$timestamp] $message" >&2
}

log_info() {
    local message="$1"
    local timestamp=$(date "+%Y-%m-%d %H:%M:%S")
    echo "[INFO] [$timestamp] $message"
}

# Error handler
handle_error() {
    local line_number="$1"
    local command="$2"
    log_error "Error occurred at line $line_number: Command '$command' failed"
    
    # Collect diagnostic information
    log_error "MySQL error log contents:"
    tail -n 50 /var/log/mysql/mysqld.log || true
    
    # Optional: additional diagnostics
    if command -v mysqladmin &> /dev/null; then
        mysqladmin status || true
    fi
    
    exit 1
}

# Set trap to catch errors
trap 'handle_error $LINENO "$BASH_COMMAND"' ERR

# Validate critical environment variables
validate_env_vars() {
    local required_vars=("MYSQL_ROOT_PASSWORD")
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            log_error "Required environment variable $var is not set"
            exit 1
        fi
    done
}

# Ensure data directory exists and has correct permissions
prepare_data_directory() {
    log_info "Preparing MySQL data directory..."
    
    # Create directories with proper permissions
    mkdir -p /var/lib/mysql /var/log/mysql
    chown -R mysql:mysql /var/lib/mysql /var/log/mysql
    chmod 755 /var/lib/mysql /var/log/mysql
    
    # Initialize data directory if needed
    if [ ! -d "/var/lib/mysql/mysql" ]; then
        log_info "Initializing MySQL data directory..."
        if ! mysqld --initialize-insecure --user=mysql; then
            log_error "Failed to initialize MySQL data directory"
            exit 1
        fi
    fi
}

# Start MySQL in safe mode
start_mysql_safe_mode() {
    log_info "Starting MySQL server in safe mode..."
    mysqld --user=mysql \
           --log-error=/var/log/mysql/mysqld.log \
           --general-log=1 \
           --general-log-file=/var/log/mysql/mysqld-general.log \
           --bind-address=0.0.0.0 \
           --mysqlx-bind-address=0.0.0.0 \
           --skip-grant-tables \
           --skip-networking &
    
    # Store the PID for process management
    MYSQL_SAFE_PID=$!
    
    # Wait for MySQL to start with improved timeout and logging
    wait_for_mysql_startup "$MYSQL_SAFE_PID"
}

# Wait for MySQL to start with enhanced error handling
wait_for_mysql_startup() {
    local mysql_pid="$1"
    local max_attempts=120
    local counter=0
    local sleep_interval=1
    
    while ! mysqladmin ping -u root --silent; do
        sleep "$sleep_interval"
        counter=$((counter+1))
        
        # Check if the process is still running
        if ! kill -0 "$mysql_pid" 2>/dev/null; then
            log_error "MySQL process has terminated unexpectedly"
            log_error "MySQL error log contents:"
            tail -n 50 /var/log/mysql/mysqld.log
            exit 1
        fi
        
        if [ $counter -gt "$max_attempts" ]; then
            log_error "MySQL failed to start after $max_attempts seconds"
            log_error "MySQL error log contents:"
            tail -n 50 /var/log/mysql/mysqld.log
            kill "$mysql_pid"
            exit 1
        fi
        
        # Periodic status logging
        if ((counter % 10 == 0)); then
            log_info "Waiting for MySQL to start... (Attempt $counter/$max_attempts)"
        fi
    done
}

# Secure MySQL installation
secure_mysql_installation() {
    log_info "Securing MySQL installation..."
    mysql -u root << MYSQL_SCRIPT
USE mysql;
FLUSH PRIVILEGES;
CREATE USER IF NOT EXISTS 'root'@'localhost' IDENTIFIED BY '$MYSQL_ROOT_PASSWORD';
CREATE USER IF NOT EXISTS 'root'@'%' IDENTIFIED BY '$MYSQL_ROOT_PASSWORD';
GRANT ALL PRIVILEGES ON *.* TO 'root'@'localhost' WITH GRANT OPTION;
GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' WITH GRANT OPTION;
FLUSH PRIVILEGES;
MYSQL_SCRIPT
}

# Initialize sample database
initialize_sample_database() {
    if [ -f /docker-entrypoint-initdb.d/employees.sql ]; then
        log_info "Initializing sample database..."
        cd /docker-entrypoint-initdb.d
        
        # Create database
        mysql -u root -p"$MYSQL_ROOT_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS employees;" || {
            log_warning "Failed to create employees database"
            return 1
        }
        
        # Import main schema
        mysql -u root -p"$MYSQL_ROOT_PASSWORD" employees < employees.sql || {
            log_error "Failed to import employees schema"
            return 1
        }
        
        # Import additional data files
        for file in load_*.dump; do
            if [ -f "$file" ]; then
                log_info "Importing data file: $file"
                mysql -u root -p"$MYSQL_ROOT_PASSWORD" employees < "$file" || {
                    log_warning "Failed to import $file"
                }
            fi
        done
        
        # Optional: Ignore errors for show_elapsed.sql
        mysql -u root -p"$MYSQL_ROOT_PASSWORD" employees < show_elapsed.sql 2>/dev/null || true
    fi
}

# Start New Relic integration with error handling
start_new_relic_integration() {
    local nri_mysql_binary="/var/db/newrelic-infra/newrelic-integrations/bin/nri-mysql"
    local nri_mysql_config="/etc/newrelic-infra/integrations.d/mysql-config.yml"
    
    if [ -x "$nri_mysql_binary" ] && [ -f "$nri_mysql_config" ]; then
        log_info "Starting New Relic MySQL integration..."
        "$nri_mysql_binary" -config "$nri_mysql_config" &
    else
        log_warning "New Relic MySQL integration binary or config not found"
    fi
}

# Main execution flow
main() {
    validate_env_vars
    prepare_data_directory
    start_mysql_safe_mode
    secure_mysql_installation
    
    # Shutdown safe mode MySQL
    kill "$MYSQL_SAFE_PID"
    wait "$MYSQL_SAFE_PID"
    
    # Restart MySQL normally
    log_info "Restarting MySQL with normal configuration..."
    mysqld --user=mysql \
           --log-error=/var/log/mysql/mysqld.log \
           --general-log=1 \
           --general-log-file=/var/log/mysql/mysqld-general.log \
           --bind-address=0.0.0.0 \
           --mysqlx-bind-address=0.0.0.0 &
    
    # Store the new MySQL PID
    MYSQL_NORMAL_PID=$!
    
    # Wait for MySQL to restart
    wait_for_mysql_startup "$MYSQL_NORMAL_PID"
    
    # Initialize database
    initialize_sample_database
    
    # Start New Relic integration
    start_new_relic_integration
    
    log_info "Startup complete. Keeping container running..."
    # Keep container running
    wait "$MYSQL_NORMAL_PID"
}

# Execute main function
main
