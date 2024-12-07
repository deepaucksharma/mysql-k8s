# MySQL-New Relic-k6 Load Testing Environment

## Overview

This project provides a comprehensive solution for developing, testing, and demonstrating MySQL performance using the Employees sample database. It integrates New Relic for monitoring and k6.io for load testing, orchestrated through Docker for local development and Kubernetes for scalable deployments in QA and demo environments.

### Primary Objectives
- Ensure high performance and reliability of MySQL database operations
- Implement robust monitoring and alerting through New Relic
- Enable seamless scalability using Kubernetes orchestration
- Provide optimal developer experience with Docker-based local development
- Facilitate comprehensive load testing using k6.io

## Architecture Overview

The solution architecture comprises several interconnected components:

1. **MySQL Database Layer**
   - Hosts the Employees sample database
   - Optimized configuration for performance and scalability
   - Integrated with New Relic for database monitoring
   - Persistent storage configuration for data retention

2. **API Layer (Node.js/Express)**
   - RESTful endpoints for database interactions
   - Connection pooling and query optimization
   - New Relic APM integration for performance tracking
   - Swagger/OpenAPI documentation
   - Error handling and logging

3. **Monitoring Layer (New Relic)**
   - Infrastructure monitoring
   - Application performance monitoring (APM)
   - Database performance monitoring
   - Custom dashboards and alerts
   - Performance analytics and reporting

4. **Load Testing Layer (k6)**
   - Realistic user interaction simulation
   - Performance benchmarking
   - Scalability testing
   - Integration with New Relic for metrics correlation
   - Custom test scenarios and thresholds

5. **Container Orchestration**
   - **Docker:** Local development environment
     - Multi-container setup with docker-compose
     - Volume management for persistence
     - Network isolation and service discovery
   - **Kubernetes:** QA and Demo environments
     - Deployment configurations
     - Service definitions
     - ConfigMaps and Secrets management
     - Resource quotas and limits

## Table of Contents

- [Architecture](#architecture)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Setup and Installation](#setup-and-installation)
  - [Local Development with Docker Compose](#local-development-with-docker-compose)
  - [Local Kubernetes Deployment](#local-kubernetes-deployment)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Load Testing with k6.io](#load-testing-with-k6io)
- [Testing](#testing)
  - [Unit Tests](#unit-tests)
  - [Integration Tests](#integration-tests)
  - [End-to-End (E2E) Tests](#end-to-end-e2e-tests)
- [CI/CD Pipeline](#cicd-pipeline)
- [Security and Best Practices](#security-and-best-practices)
- [Data Management](#data-management)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Architecture

The architecture of this project is modular, ensuring scalability, maintainability, and ease of deployment across different environments. Here's a high-level overview:

1. **MySQL Database:**
   - Hosts the Employees sample database.
   - Integrated with New Relic for monitoring database performance and health.
   - Configured with performance optimizations like indexing and buffer pool sizing.
   - Uses ephemeral storage for development and testing environments.

2. **API Layer:**
   - Built with Node.js and Express.
   - Provides RESTful endpoints to interact with the MySQL database.
   - Instrumented with New Relic APM for application performance monitoring.

3. **Load Generator:**
   - Utilizes k6.io for load testing the API layer.
   - Simulates realistic user interactions and stress tests the system.
   - Monitors performance metrics and integrates with New Relic for real-time insights.

4. **Docker:**
   - Containers encapsulate each component (MySQL, API Layer, Load Generator).
   - Ensures consistency across development environments.
   - Facilitates easy scaling and management of services.

5. **Kubernetes:**
   - Orchestrates container deployments for QA and demo environments.
   - Manages scaling, load balancing, and service discovery.
   - Implements security best practices through Network Policies and RBAC.

6. **CI/CD Pipeline:**
   - Automates the building, testing, and deployment of containers.
   - Ensures continuous integration and delivery to Kubernetes clusters.

## Features

- **Scalable Architecture:** Easily scale components horizontally to handle increased load.
- **Comprehensive Monitoring:** Real-time insights into database and application performance via New Relic.
- **Automated Load Testing:** Simulate high traffic scenarios with k6.io to identify performance bottlenecks.
- **Secure Deployments:** Implements best practices for security, including secrets management and network policies.
- **Flexible Configuration:** Manage environment-specific settings through environment variables and configuration files.
- **Automated CI/CD:** Streamlines the development workflow with automated testing and deployment processes.

## Technology Stack

- **Docker & Docker Compose:** Containerization and orchestration for local development.
- **Kubernetes:** Container orchestration for QA and demo deployments.
- **Node.js & Express:** API layer development.
- **MySQL:** Relational database management.
- **New Relic:** Application and infrastructure monitoring.
- **k6.io:** Load testing and performance benchmarking.
- **GitHub Actions:** CI/CD pipeline automation.
- **WSL 2:** Windows Subsystem for Linux for a seamless development experience on Windows.

## Prerequisites

Before getting started, ensure you have the following installed on your Windows machine:

- **Docker Desktop:** [Download](https://www.docker.com/products/docker-desktop)
  - **Enable WSL 2 Integration:** During installation, ensure that WSL 2 integration is enabled.
- **WSL 2:** [Installation Guide](https://docs.microsoft.com/en-us/windows/wsl/install)
- **Git:** [Download](https://git-scm.com/downloads)
- **Node.js:** [Download](https://nodejs.org/en/download/)
- **kubectl:** [Installation Guide](https://kubernetes.io/docs/tasks/tools/install-kubectl/)
- **Minikube** or **Docker Desktop's Kubernetes:** [Minikube Installation](https://minikube.sigs.k8s.io/docs/start/)
- **New Relic Account:** [Sign Up](https://newrelic.com/signup)
- **Python 3:** [Download](https://www.python.org/downloads/)
- **Go (for building nri-mysql):** [Download](https://golang.org/dl/)

## Setup and Installation

### Quick Start

1. **Setup Development Environment (Windows)**
   ```powershell
   # Run as Administrator
   ./scripts/setup-dev-env.ps1
   ```
   This script will:
   - Install required tools (Docker Desktop, Node.js, Python, k6)
   - Create .env file from template
   - Install project dependencies
   - Configure Docker Desktop with Kubernetes

2. **Deploy Local Environment**
   ```bash
   ./scripts/deploy-local.sh
   ```
   This script will:
   - Start all services (MySQL, API, Load Generator)
   - Wait for services to be healthy
   - Display service URLs

3. **Load Test Data (Optional)**
   ```bash
   python scripts/bulk_insert.py --rows 100000 --batch 10000
   ```
   This script will:
   - Create test tables
   - Insert sample employee data
   - Show progress and completion time

### Service URLs

After deployment, services are available at:
- API Layer: http://localhost:3000
- Metrics Dashboard: http://localhost:8080
- New Relic APM: https://one.newrelic.com

### Environment Variables

Required environment variables in `.env`:
- `MYSQL_PASSWORD`: MySQL root password
- `NEW_RELIC_LICENSE_KEY`: New Relic license key
- `NEWRELIC_APP_NAME`: Application name in New Relic

## Configuration

### Environment Variables

Manage environment-specific settings via the `.env` file for Docker Compose and Kubernetes Secrets for Kubernetes deployments.

- **.env.example:**

  ```env
  # MySQL Configuration
  MYSQL_ROOT_PASSWORD=your_mysql_password

  # New Relic Configuration
  NEW_RELIC_LICENSE_KEY=your_new_relic_license_key
  ```

### Kubernetes Secrets

Sensitive information is managed using Kubernetes Secrets. Ensure that the `secrets.yaml` file is populated with base64-encoded credentials.

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: mysql-secret
type: Opaque
data:
  MYSQL_ROOT_PASSWORD: <base64_encoded_password>

---
apiVersion: v1
kind: Secret
metadata:
  name: newrelic-license-key
type: Opaque
data:
  NEW_RELIC_LICENSE_KEY: <base64_encoded_license_key>
```

**Encoding Secrets:**

Encode your secrets using base64:

```bash
echo -n 'your_mysql_password' | base64
echo -n 'your_new_relic_license_key' | base64
```

## Running the Application

### Starting Services with Docker Compose

```bash
./scripts/deploy-local.sh
```

This script performs the following actions:

1. Loads environment variables from `.env`.
2. Builds Docker images for MySQL, API Layer, Load Generator, and nri-mysql.
3. Starts the containers in detached mode.
4. Waits for MySQL to initialize.
5. (Optional) Runs the bulk insert script to populate additional data.

### Stopping Services

```bash
./scripts/reset-local.sh
```

This script stops and removes all containers and associated volumes.

## Load Testing with k6.io

### Running Load Tests Locally

1. **Ensure the API Layer is Running:**

   Make sure the API service is accessible at `http://localhost:3000`.

2. **Run k6 Tests:**

   ```bash
   export NEW_RELIC_LICENSE_KEY=your_new_relic_license_key
   export API_URL=http://localhost:3000
   docker build -t load-generator:latest load-generator/
   docker run --env NEW_RELIC_LICENSE_KEY=$NEW_RELIC_LICENSE_KEY --env API_URL=$API_URL load-generator:latest
   ```

   This command builds the Load Generator Docker image and runs the k6 test script with the specified environment variables.

### Running Load Tests on Kubernetes

1. **Deploy Load Generator:**

   Ensure the `load-generator-deployment.yaml` is applied to your Kubernetes cluster.

2. **Monitor Tests:**

   View the logs of the Load Generator to monitor test progress and results:

   ```bash
   kubectl logs -f deployment/load-generator
   ```

## Testing

### Unit Tests

The API layer includes unit tests to verify individual components and functions.

- **Location:** `api-layer/__tests__/server.test.js`

- **Run Tests:**

  ```bash
  cd api-layer
  npm install
  npm test
  ```

### Integration Tests

Integration tests ensure that different services interact correctly, particularly between the API layer and MySQL.

- **Approach:**
  - Mock database connections.
  - Validate API responses based on simulated database interactions.

### End-to-End (E2E) Tests

End-to-end tests simulate real user scenarios to validate the entire workflow.

- **Load Testing:** Performed using k6.io to assess system behavior under load.
- **Automated E2E Testing:** Consider using tools like **Cypress** or **Postman** for comprehensive testing beyond load scenarios.

## CI/CD Pipeline

Automate the building, testing, and deployment processes using GitHub Actions.

### Workflow Configuration

- **File:** `.github/workflows/deploy.yml`

- **Triggers:**
  - Runs on every push to the `main` branch.

- **Jobs:**
  - **Checkout Code:** Retrieves the latest code from the repository.
  - **Set up Docker Buildx:** Prepares Docker Buildx for multi-platform builds.
  - **Build Docker Images:** Builds images for MySQL, API Layer, Load Generator, and nri-mysql.
  - **Set Kubernetes Context:** Configures `kubectl` with the appropriate context using Kubernetes configuration stored in GitHub Secrets.
  - **Apply Kubernetes Manifests:** Deploys all Kubernetes resources to the cluster.

### Secrets Management

Store sensitive information like `KUBE_CONFIG` and other credentials securely in GitHub Secrets.

## Security and Best Practices

- **Secrets Management:**
  - Use Kubernetes Secrets to manage sensitive data.
  - Avoid hardcoding credentials in code or configuration files.

- **Security Context:**
  - Run containers as non-root users to minimize security risks.

- **Network Policies:**
  - Implement Kubernetes Network Policies to restrict traffic between services.

- **Resource Limits:**
  - Define CPU and memory requests and limits to ensure stable performance and prevent resource exhaustion.

- **Vulnerability Scanning:**
  - Regularly scan Docker images for vulnerabilities using tools like **Trivy** or **Clair**.

- **Monitoring and Logging:**
  - Utilize New Relic for real-time monitoring.
  - Aggregate logs using the ELK stack or Fluentd for centralized logging.

## Data Management

- **Employees Database:**
  - Populated with realistic data to simulate real-world scenarios.
  - Includes a script (`bulk_insert.py`) to scale the database by duplicating entries.

- **Database Optimization:**
  - Configured with performance optimizations like `innodb_buffer_pool_size` and `max_connections`.
  - Implements slow query logging for performance analysis.

## Configuration Flexibility

- **Environment Variables:**
  - Manage different configurations for development, QA, and demo environments using `.env` files and Kubernetes Secrets.

- **Infrastructure as Code:**
  - Define all infrastructure components using code (Dockerfiles, Kubernetes manifests) to ensure consistency and reproducibility.

- **Modular Scripts:**
  - Use scripts for building, deploying, and resetting environments to streamline workflows.

## Troubleshooting

### Common Issues

1. **Docker Compose Not Found in WSL 2:**

   **Solution:**
   - Ensure Docker Desktop is installed and WSL 2 integration is enabled.
   - Follow the [Docker Desktop WSL 2 Integration Guide](https://docs.docker.com/go/wsl2/) for detailed instructions.

2. **Kubernetes Deployment Failures:**

   **Solution:**
   - Check pod statuses:

     ```bash
     kubectl get pods
     ```

   - View logs for failing pods:

     ```bash
     kubectl logs <pod-name>
     ```

   - Describe resources for more details:

     ```bash
     kubectl describe deployment <deployment-name>
     ```

3. **MySQL Initialization Issues:**

   **Solution:**
   - Ensure the `entrypoint.sh` script has execute permissions.
   - Verify that the `employees.sql` file is correctly placed in `/docker-entrypoint-initdb.d/`.
   - Check MySQL logs for specific error messages.

4. **Load Tests Not Running Properly:**

   **Solution:**
   - Ensure the API Layer is accessible at the specified `API_URL`.
   - Verify environment variables are correctly set for the Load Generator.
   - Check Load Generator logs for errors.

### Debugging Steps

1. **Verify Docker Services:**

   ```bash
   docker ps
   ```

2. **Check Kubernetes Resources:**

   ```bash
   kubectl get all
   ```

3. **Inspect Logs:**

   ```bash
   kubectl logs <pod-name>
   ```

4. **Rebuild and Redeploy:**

   Sometimes, rebuilding Docker images and redeploying can resolve issues.

   ```bash
   ./scripts/deploy-local.sh
   ```
