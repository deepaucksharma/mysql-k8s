#!/bin/bash

# Use Docker Desktop's Kubernetes context
kubectl config use-context docker-desktop

# Create dummy New Relic secret directly
kubectl create secret generic newrelic-secret \
    --from-literal=NEW_RELIC_LICENSE_KEY=dummy_local_dev_license_key_12345 \
    --from-literal=NEW_RELIC_ACCOUNT_ID=1234567

# Create MySQL secret
kubectl create secret generic mysql-secret \
    --from-literal=MYSQL_ROOT_PASSWORD=dummy_local_password \
    --from-literal=MYSQL_PASSWORD=dummy_local_password

# Build local images
docker build -f Dockerfile.mysql -t mysql-newrelic:8.0 .
docker build -t api-layer:latest ./api-layer
docker build -t load-generator:latest ./load-generator

# Apply Kubernetes manifests
kubectl apply -f k8s/mysql-pvc.yaml
kubectl apply -f k8s/mysql-deployment.yaml
kubectl apply -f k8s/mysql-service.yaml
kubectl apply -f k8s/api-layer-deployment.yaml
kubectl apply -f k8s/api-layer-service.yaml
kubectl apply -f k8s/load-generator-deployment.yaml
kubectl apply -f k8s/load-generator-hpa.yaml
kubectl apply -f k8s/network-policy.yaml

# Wait for deployments to be ready
kubectl rollout status deployment/mysql
kubectl rollout status deployment/api-layer
kubectl rollout status deployment/load-generator

# Port forward services for local access
kubectl port-forward service/api-layer-service 3000:3000 &
kubectl port-forward service/mysql 3306:3306 &

echo "Local Kubernetes development environment is ready!"
