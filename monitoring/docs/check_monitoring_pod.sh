#!/usr/bin/env bash
set -euo pipefail

NS="monitoring"
APP_NS="app"

echo "== Monitoring pods =="
kubectl get pods -n "$NS" -o wide

echo

echo "== Monitoring services =="
kubectl get svc -n "$NS"

echo

echo "== Grafana service and endpoints =="
kubectl get svc kube-prometheus-stack-grafana -n "$NS" -o wide
kubectl get endpoints kube-prometheus-stack-grafana -n "$NS" -o wide
kubectl describe svc kube-prometheus-stack-grafana -n "$NS"

echo

echo "== Prometheus CR and endpoints =="
kubectl get prometheus -n "$NS"
kubectl describe prometheus -n "$NS"
kubectl get endpoints kube-prometheus-stack-prometheus -n "$NS" -o wide
kubectl describe svc kube-prometheus-stack-prometheus -n "$NS"

echo

echo "== StatefulSets and PVCs =="
kubectl get statefulset -n "$NS"
kubectl get pvc -n "$NS"
kubectl get storageclass

echo

echo "== Alloy pods and logs =="
kubectl get pods -n "$NS" -l app.kubernetes.io/name=alloy -o wide
kubectl logs -n "$NS" -l app.kubernetes.io/name=alloy -c alloy --tail=100 || true

echo

echo "== Loki pod and logs =="
kubectl get pods -n "$NS" | grep -i loki || true
kubectl describe pod loki-0 -n "$NS" || true
kubectl logs loki-0 -n "$NS" -c loki --tail=100 || true
kubectl logs loki-0 -n "$NS" -c loki --previous --tail=100 || true
kubectl get configmap loki -n "$NS" -o yaml | sed -n '1,220p' || true

echo

echo "== App pods and labels =="
kubectl get pods -n "$APP_NS" --show-labels
kubectl get deploy -n "$APP_NS" --show-labels

echo

echo "== Quick app logs =="
kubectl logs -n "$APP_NS" deployment/backend --tail=50 || true
kubectl logs -n "$APP_NS" deployment/frontend --tail=50 || true

echo

echo "== Ingress =="
kubectl get ingress -n "$APP_NS" -o wide
kubectl describe ingress app-ingress -n "$APP_NS" || true
