# MySQL-New Relic-k6 Load Testing Environment

## Overview

This project sets up a comprehensive environment for developing, testing, and demonstrating MySQL performance using the Employees sample database. It integrates New Relic for monitoring and k6.io for load testing, orchestrated via Docker for local development and Kubernetes for QA and demo deployments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
  - [Local Development with Docker Compose](#local-development-with-docker-compose)
  - [Local Kubernetes Deployment](#local-kubernetes-deployment)
- [Load Testing with k6.io](#load-testing-with-k6io)
- [Testing](#testing)
- [CI/CD Pipeline](#cicd-pipeline)
- [Security and Best Practices](#security-and-best-practices)
- [Data Management](#data-management)
- [Configuration Flexibility](#configuration-flexibility)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## Prerequisites

- **Docker & Docker Compose**
- **Node.js** (for API layer development)
- **k6.io** (for load testing)
- **Kubernetes CLI (`kubectl`)** 
- **Minikube** or **Docker Desktop's Kubernetes**
- **New Relic Account** with a valid **license key**
- **Git** (for version control)

## Environment Setup

### Local Development with Docker Compose

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/your-repo/mysql-newrelic-k6.git
   cd mysql-newrelic-k6
   ```

2. **Configure Environment Variables:**

   Create a `.env` file in the root directory:

   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

3. **Build and Run Containers:**

   ```bash
   ./scripts/deploy-local.sh
   ```

4. **Access Services:**

   - **MySQL:** `localhost:3306`
   - **API Layer:** `localhost:3000`

5. **Populate Additional Data (Optional):**

   ```bash
   docker exec -it mysql-newrelic bash
   python /scripts/bulk_insert.py
   ```

### Local Kubernetes Deployment

1. **Ensure Local Kubernetes is Running:**

   - **Minikube:**

     ```bash
     minikube start
     ```

   - **Docker Desktop's Kubernetes:**

     Ensure Kubernetes is enabled in Docker Desktop settings.

2. **Build Docker Images Locally:**

   Ensure your Docker daemon is accessible to Kubernetes (e.g., Minikube's Docker environment).

   - **For Minikube:**

     ```bash
     eval $(minikube docker-env)
     ```

   - **Build Images:**

     ```bash
     # Build MySQL Image
     docker build -f Dockerfile.mysql -t mysql-newrelic:8.0 .

     # Build API Layer Image
     cd api-layer
     docker build -t api-layer:latest .
     cd ..

     # Build Load Generator Image
     cd load-generator
     docker build -t load-generator:latest .
     cd ..
     ```

3. **Apply Kubernetes Manifests:**

   ```bash
   kubectl apply -f k8s/secrets.yaml
   kubectl apply -f k8s/mysql-pvc.yaml
   kubectl apply -f k8s/mysql-deployment.yaml
   kubectl apply -f k8s/mysql-service.yaml
   kubectl apply -f k8s/api-layer-deployment.yaml
   kubectl apply -f k8s/api-layer-service.yaml
   kubectl apply -f k8s/load-generator-deployment.yaml
   kubectl apply -f k8s/load-generator-hpa.yaml
   kubectl apply -f k8s/network-policy.yaml
   kubectl apply -f k8s/nri-mysql-deployment.yaml
   ```

4. **Verify Deployments:**

   ```bash
   kubectl get all
   ```

5. **Access Services:**

   - **API Layer:**

     ```bash
     kubectl port-forward service/api-layer-service 3000:3000
     ```

## Load Testing with k6.io

### Running Load Tests Locally

1. **Ensure the API Layer is Running Locally via Docker Compose or Kubernetes.**

2. **Run k6 Tests:**

   ```bash
   export NEW_RELIC_LICENSE_KEY=your_new_relic_license_key
   export API_URL=http://localhost:3000 # or your Kubernetes API Layer URL
   docker build -t load-generator:latest load-generator/
   docker run --env NEW_RELIC_LICENSE_KEY=$NEW_RELIC_LICENSE_KEY --env API_URL=$API_URL load-generator:latest
   ```

### Running Load Tests on Kubernetes

1. **Deploy Load Generator:**

   Ensure the `load-generator-deployment.yaml` is applied.

2. **Monitor Tests:**

   Use `kubectl logs` to monitor the load generator.

   ```bash
   kubectl logs -f deployment/load-generator
   ```

## Testing

### Unit Tests

- **API Layer Unit Tests**: Located in `api-layer/__tests__/`.

- **Run Tests:**

  ```bash
  cd api-layer
  npm install
  npm test
  ```

### Integration Tests

- **Database Integration Tests**: Ensure API endpoints correctly interact with MySQL.

- **Run Tests:**

  Similar to unit tests but focus on end-to-end interactions.

### End-to-End (E2E) Tests

- **Load Testing with k6.io**: Simulate realistic workloads and monitor system behavior.

- **Automated E2E Testing**: Use tools like **Cypress** or **Postman** for comprehensive E2E tests beyond load testing.

## CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: CI/CD Pipeline

on:
  push:
    branches:
      - main

jobs:
  build-deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Code
        uses: actions/checkout@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2

      - name: Build MySQL Image
        run: |
          docker build -f Dockerfile.mysql -t mysql-newrelic:8.0 .

      - name: Build API Layer Image
        run: |
          cd api-layer
          docker build -t api-layer:latest .
          cd ..

      - name: Build Load Generator Image
        run: |
          cd load-generator
          docker build -t load-generator:latest .
          cd ..

      - name: Build nri-mysql Image
        run: |
          ./scripts/build-nri-mysql.sh

      - name: Set Kubernetes Context
        uses: azure/setup-kubectl@v1
        with:
          version: 'latest'
          kubeconfig: ${{ secrets.KUBE_CONFIG }}

      - name: Apply Kubernetes Manifests
        run: |
          kubectl apply -f k8s/secrets.yaml
          kubectl apply -f k8s/mysql-pvc.yaml
          kubectl apply -f k8s/mysql-deployment.yaml
          kubectl apply -f k8s/mysql-service.yaml
          kubectl apply -f k8s/api-layer-deployment.yaml
          kubectl apply -f k8s/api-layer-service.yaml
          kubectl apply -f k8s/load-generator-deployment.yaml
          kubectl apply -f k8s/load-generator-hpa.yaml
          kubectl apply -f k8s/network-policy.yaml
          kubectl apply -f k8s/nri-mysql-deployment.yaml
```

## Security and Best Practices

- **Readiness and Liveness Probes:** Implemented in Kubernetes deployment manifests.
- **Security Context:** Running containers as non-root users for enhanced security.
- **Network Policies:** Restrict traffic flow between services.
- **Resource Requests and Limits:** Defined to ensure stable performance.
- **Use Specific Version Tags:** Avoid using `latest` to ensure stability.
- **Secrets Management:** Managed via Kubernetes Secrets.

## Data Management

- **Employees Database:** Populated with realistic and diverse data.
- **Bulk Insert Scripts:** Facilitate data scaling and testing various scenarios.

## Configuration Flexibility

- **Environment Variables:** Manage different settings via `.env` files.
- **Docker Compose Profiles:** Handle different environments if needed.
- **Kubernetes Namespaces:** Segregate environments within Kubernetes.

## Troubleshooting

- **Check Pod Status:**

  ```bash
  kubectl get pods
  ```

- **View Logs:**

  ```bash
  kubectl logs <pod-name>
  ```

- **Describe Resources:**

  ```bash
  kubectl describe deployment <deployment-name>
  ```

## Contributing

Contributions are welcome! Please open issues and submit pull requests for enhancements or bug fixes.

# MySQL Performance Monitoring with New Relic and Kubernetes

## Overview
This project provides a comprehensive solution for monitoring MySQL performance using New Relic and Kubernetes, with a focus on observability, security, and performance optimization.

## Features
- MySQL 8.0 Container
- New Relic Integration
- Enhanced Security Configuration
- Performance Monitoring
- Kubernetes Ready

## Prerequisites
- Docker
- Docker Compose
- Kubernetes Cluster (optional)
- New Relic Account

## Configuration
- MySQL Configuration: `configs/mysql/my.cnf`
- New Relic Integration: `configs/integrations.d/mysql-config.yml`

## Quick Start

### Build Docker Image
```bash
docker build -f Dockerfile.mysql -t mysql-newrelic:8.0 .
```

### Run Container
```bash
docker run -d \
  --name mysql-newrelic \
  -e MYSQL_ROOT_PASSWORD=your_password \
  -p 3306:3306 \
  mysql-newrelic:8.0
```

## Environment Variables
- `MYSQL_ROOT_PASSWORD`: MySQL root password
- `ENVIRONMENT`: Deployment environment
- `CLUSTER_NAME`: Kubernetes cluster name
- `NEWRELIC_LICENSE_KEY`: New Relic license key

## Security
- Non-root container execution
- Strict file permissions
- Environment-based configuration

## Monitoring
Integrated New Relic MySQL integration provides:
- Performance metrics
- Database statistics
- Query performance tracking

## Contributing
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License
[Specify your license here]

## Disclaimer
This is a sample implementation. Ensure to review and adapt to your specific security and performance requirements.
