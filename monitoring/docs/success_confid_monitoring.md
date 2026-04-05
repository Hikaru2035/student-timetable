# Monitoring setup commands (successful runs)

Project path:

```bash
cd /home/dev/student-timetable/student-timetable
```

## 1) Create namespace and add Helm repos

```bash
kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update
```

## 2) Install kube-prometheus-stack

Values file used:

```text
/home/dev/student-timetable/student-timetable/monitoring/kube-prometheus-stack/values.yaml
```

Install/upgrade:

```bash
helm upgrade --install kube-prometheus-stack prometheus-community/kube-prometheus-stack \
  -n monitoring \
  -f /home/dev/student-timetable/student-timetable/monitoring/kube-prometheus-stack/values.yaml
```

Observed successful components after install:
- kube-prometheus-stack-grafana
- kube-prometheus-stack-kube-state-metrics
- kube-prometheus-stack-operator
- kube-prometheus-stack-prometheus-node-exporter

## 3) Install Loki

Values file used:

```text
/home/dev/student-timetable/student-timetable/monitoring/loki/values.yaml
```

Install/upgrade:

```bash
helm upgrade --install loki grafana/loki \
  -n monitoring \
  -f /home/dev/student-timetable/student-timetable/monitoring/loki/values.yaml
```

Successful items that appeared from Loki install path:
- loki service
- loki-gateway service
- loki-headless service
- loki-memberlist service

Internal push URL used by agents:

```text
http://loki-gateway.monitoring.svc.cluster.local/loki/api/v1/push
```

## 4) Install Alloy in Kubernetes for app namespace logs

Values file used:

```text
/home/dev/student-timetable/student-timetable/monitoring/alloy-k8s/values.yaml
```

Install/upgrade:

```bash
helm upgrade --install alloy grafana/alloy \
  -n monitoring \
  -f /home/dev/student-timetable/student-timetable/monitoring/alloy-k8s/values.yaml
```

Successful state reached:
- alloy pods running in namespace monitoring
- labels for app pods confirmed:
  - app=backend
  - app=frontend

## 5) Verify Grafana service and access it from VM

Check service:

```bash
kubectl get svc -n monitoring kube-prometheus-stack-grafana
kubectl get endpoints kube-prometheus-stack-grafana -n monitoring -o wide
kubectl describe svc kube-prometheus-stack-grafana -n monitoring
```

Access method that works from VMware VM:

```bash
kubectl port-forward --address 0.0.0.0 svc/kube-prometheus-stack-grafana -n monitoring 3000:80
```

Open from your machine:

```text
http://192.168.101.196:3000
```

## 6) Add Loki datasource in Grafana

Use this URL in Grafana datasource settings:

```text
http://loki-gateway.monitoring.svc.cluster.local/
```

## 7) Useful Loki queries that worked for FE/BE exploration

Frontend:

```logql
{namespace="app", app="frontend"}
```

Backend by pod:

```logql
{namespace="app", pod=~"backend-.*"}
```

All app logs:

```logql
{namespace="app"}
```

## Notes / current caveats

- Grafana service inside cluster is healthy and returns `/login` through the cluster service path.
- Public AWS ELB access for Grafana was blocked by AWS account limitations, so VM port-forward is the working access path.
- Prometheus CR exists, but Prometheus server was not reconciled because the values still referenced storage class `gp3` while the cluster only had `gp2`. Update `storageClassName` in `/home/dev/student-timetable/student-timetable/monitoring/kube-prometheus-stack/values.yaml` before expecting Prometheus metrics to work.
