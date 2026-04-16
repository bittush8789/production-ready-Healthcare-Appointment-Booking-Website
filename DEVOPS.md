# DevOps & DevSecOps Documentation

This document outlines the CI/CD, containerization, orchestration, and monitoring setup for the Green Valley Clinic application.

## 1. Containerization (Docker)
The application is containerized using a multi-stage `Dockerfile`.
- **Stage 1**: Builds the React frontend using Vite.
- **Stage 2**: Sets up the Node.js/Express backend and serves the static frontend files.

### Build and Run Locally
```bash
docker build -t clinic-app .
docker run -p 3000:3000 clinic-app
```

## 2. CI/CD Pipeline (GitHub Actions)
The pipeline is defined in `.github/workflows/devsecops.yml`. It includes the following stages:

### Security & Quality Scans (DevSecOps)
- **Gitleaks**: Scans the repository for hardcoded secrets (API keys, tokens).
- **SonarQube**: Performs static code analysis (SAST) to identify code smells, bugs, and security vulnerabilities.
- **OWASP ZAP**: Performs dynamic security testing (DAST) on the deployed application.

### Build & Push
- Builds the Docker image and pushes it to DockerHub.
- Requires secrets: `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`.

### Deployment
- Deploys the application to a Kubernetes cluster.
- Requires secret: `KUBE_CONFIG`.

## 3. Orchestration (Kubernetes)
Manifests are located in the `k8s/` directory.
- `deployment.yaml`: Defines a 3-replica deployment with resource limits and health probes.
- `service.yaml`: Exposes the application via a LoadBalancer.

### Manual Deployment
```bash
kubectl apply -f k8s/
```

## 4. Monitoring (Prometheus & Grafana)
Configurations are located in the `monitoring/` directory.

### Prometheus
- Configured to automatically discover and scrape metrics from Kubernetes pods with the `prometheus.io/scrape: "true"` annotation.
- Configuration: `monitoring/prometheus.yml`.

### Grafana
- A basic dashboard is provided in `monitoring/grafana-dashboard.json`.
- Import this JSON into your Grafana instance to visualize HTTP request rates and system health.

## 5. Required Secrets
To enable the full pipeline, configure the following secrets in your GitHub repository:
- `SONAR_TOKEN`: Token from SonarQube.
- `SONAR_HOST_URL`: URL of your SonarQube server.
- `DOCKERHUB_USERNAME`: Your DockerHub username.
- `DOCKERHUB_TOKEN`: Your DockerHub personal access token.
- `KUBE_CONFIG`: Your base64-encoded kubeconfig file.
