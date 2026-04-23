# Student Timetable AWS deployment command journal

This file is a cleaned-up learning log of the commands that worked during the deployment.
Secrets, passwords, and tokens are intentionally redacted.

## Phase 0 - local toolchain verification

```bash
aws --version
kubectl version --client
eksctl version
helm version
docker version
```

## Phase 1 - ECR and images

Create repositories in the target account:

```bash
aws ecr create-repository --region ap-southeast-1 --repository-name student-timetable-backend
aws ecr create-repository --region ap-southeast-1 --repository-name student-timetable-frontend
```

Login to ECR:

```bash
aws ecr get-login-password --region ap-southeast-1 | docker login --username AWS --password-stdin 153860374757.dkr.ecr.ap-southeast-1.amazonaws.com
```

Build and tag images:

```bash
docker build -t student-timetable-backend:local ./backend
docker build --build-arg VITE_API_URL=/api -t student-timetable-frontend:local ./frontend

docker tag student-timetable-backend:local 153860374757.dkr.ecr.ap-southeast-1.amazonaws.com/student-timetable-backend:v1
docker tag student-timetable-frontend:local 153860374757.dkr.ecr.ap-southeast-1.amazonaws.com/student-timetable-frontend:v1
```

Push images:

```bash
docker push 153860374757.dkr.ecr.ap-southeast-1.amazonaws.com/student-timetable-backend:v1
docker push 153860374757.dkr.ecr.ap-southeast-1.amazonaws.com/student-timetable-frontend:v1
```

## Phase 2 - EKS cluster and core addons

Create the cluster from YAML:

```bash
eksctl create cluster -f infra/aws/eksctl/cluster.yaml
```

Check kube access:

```bash
kubectl get nodes
kubectl get pods -A
kubectl config current-context
```

Install Metrics Server:

```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
kubectl get pods -n kube-system | grep metrics-server
```

Install AWS Load Balancer Controller:

```bash
curl -O https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/main/docs/install/iam_policy.json

aws iam create-policy \
  --policy-name AWSLoadBalancerControllerIAMPolicy \
  --policy-document file://iam_policy.json

eksctl create iamserviceaccount \
  --cluster student-timetable-prod \
  --namespace kube-system \
  --name aws-load-balancer-controller \
  --region ap-southeast-1 \
  --attach-policy-arn arn:aws:iam::153860374757:policy/AWSLoadBalancerControllerIAMPolicy \
  --override-existing-serviceaccounts \
  --approve

helm repo add eks https://aws.github.io/eks-charts
helm repo update

helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=student-timetable-prod \
  --set serviceAccount.create=false \
  --set serviceAccount.name=aws-load-balancer-controller \
  --set region=ap-southeast-1 \
  --set vpcId=$(aws eks describe-cluster --name student-timetable-prod --region ap-southeast-1 --query "cluster.resourcesVpcConfig.vpcId" --output text)
```

## Phase 3 - RDS and app networking

RDS was created in the same VPC as EKS.
The effective check commands were:

```bash
aws eks describe-cluster --name student-timetable-prod --region ap-southeast-1 --query "cluster.resourcesVpcConfig.vpcId" --output text
aws rds describe-db-instances --db-instance-identifier student-timetable-prod-db --region ap-southeast-1 --query "DBInstances[0].DBSubnetGroup.VpcId" --output text
aws ec2 describe-security-groups --group-ids sg-09add986d99841264 --region ap-southeast-1 --query "SecurityGroups[0].[GroupId,GroupName,VpcId]" --output table
```

From inside the backend pod, the useful reachability checks were:

```bash
kubectl exec -it -n app <backend-pod> -- sh
nslookup student-timetable-prod-db.cnykqkqq86yr.ap-southeast-1.rds.amazonaws.com
nc -vz student-timetable-prod-db.cnykqkqq86yr.ap-southeast-1.rds.amazonaws.com 5432
```

## Phase 4 - backend deployment and Prisma

Inspect runtime environment:

```bash
kubectl exec -it -n app <backend-pod> -- printenv | grep DATABASE_URL
```

Run Prisma in the pod after RDS connectivity was fixed:

```bash
kubectl exec -it -n app <backend-pod> -- sh
npx prisma -v
npx prisma db push --schema prisma/schema.prisma
```

Expected successful message:

```text
Your database is now in sync with your Prisma schema.
```

## Phase 5 - ALB ingress and app verification

Ingress apply and watch:

```bash
kubectl apply -f infra/k8s/ingress/ingress.yaml
kubectl get ingress -n app -w
```

Smoke tests:

```bash
curl -I http://<ALB_HOSTNAME>/
curl -I http://<ALB_HOSTNAME>/api/health
```

Registration API test:

```bash
curl -i -X POST http://<ALB_HOSTNAME>/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"username":"test1","password":"123456","role":"STUDENT"}'
```

## Phase 6 - troubleshooting notes that mattered

### CORS mismatch
If browser requests failed but curl succeeded, the effective backend check was:

```bash
kubectl logs -n app deploy/backend --tail=200
```

The fix was to ensure `CORS_ORIGIN` included the active ALB hostname.

### Secret not found in new backend pods
The useful inspection commands were:

```bash
kubectl describe pod -n app <new-backend-pod>
kubectl get secret -n app backend-env
```

### Pod Identity and AWS provider checks

```bash
aws eks list-pod-identity-associations --cluster-name student-timetable-prod --region ap-southeast-1
kubectl -n kube-system get pods | grep -E 'csi-secrets-store|provider-aws|eks-pod-identity-agent'
kubectl -n kube-system logs -l app.kubernetes.io/name=eks-pod-identity-agent --tail=100
```

## Phase 7 - External Secrets Operator

Install ESO:

```bash
helm repo add external-secrets https://charts.external-secrets.io
helm repo update
helm install external-secrets external-secrets/external-secrets -n external-secrets --create-namespace
```

Create IAM role and policy for ESO controller using Pod Identity:

```bash
aws iam create-role --role-name ExternalSecretsPodIdentityRole --assume-role-policy-document file:///tmp/eso-pod-identity-trust.json
aws iam create-policy --policy-name ExternalSecretsReadBackendPolicy --policy-document file:///tmp/eso-secrets-policy.json
aws iam attach-role-policy --role-name ExternalSecretsPodIdentityRole --policy-arn arn:aws:iam::153860374757:policy/ExternalSecretsReadBackendPolicy
aws eks create-pod-identity-association --cluster-name student-timetable-prod --namespace external-secrets --service-account external-secrets --role-arn arn:aws:iam::153860374757:role/ExternalSecretsPodIdentityRole
```

Apply `SecretStore` and `ExternalSecret`:

```bash
kubectl apply -f infra/k8s/external-secrets/secretstore.yaml
kubectl apply -f infra/k8s/external-secrets/backend-external-secret.yaml
```

Verify ESO sync:

```bash
kubectl describe secretstore aws-secretsmanager -n app
kubectl get externalsecret -n app
kubectl describe externalsecret backend-env -n app
kubectl get secret -n app backend-env
```

Expected end state:
- SecretStore Ready=True
- ExternalSecret Ready=True
- `backend-env` exists as a Kubernetes Secret

## Phase 8 - steady-state checks

```bash
kubectl get pods -n app
kubectl get svc -n app
kubectl get endpoints -n app
kubectl get ingress -n app -o wide
kubectl logs -n app deploy/backend --tail=100
kubectl logs -n app deploy/frontend --tail=100
```

## Recommended cleanup after successful deployment

- Rotate any DB passwords and JWT secrets exposed during debugging.
- Set RDS back to private if it was temporarily made public.
- Remove temporary debug rules from the RDS security group.
- Keep one secret flow only:
  - either External Secrets -> Kubernetes Secret -> env vars
  - or CSI mount -> file-based secret consumption
- If backend no longer uses CSI, remove:
  - `infra/k8s/backend/secretproviderclass.yaml`
  - CSI volume mounts from backend deployment
  - `backend-secret-sync` temporary pod
# Student Timetable AWS deployment command journal

This file is a cleaned-up learning log of the commands that worked during the deployment.
Secrets, passwords, and tokens are intentionally redacted.

## Phase 0 - local toolchain verification

```bash
aws --version
kubectl version --client
eksctl version
helm version
docker version
```

## Phase 1 - ECR and images

Create repositories in the target account:

```bash
aws ecr create-repository --region ap-southeast-1 --repository-name student-timetable-backend
aws ecr create-repository --region ap-southeast-1 --repository-name student-timetable-frontend
```

Login to ECR:

```bash
aws ecr get-login-password --region ap-southeast-1 | docker login --username AWS --password-stdin 153860374757.dkr.ecr.ap-southeast-1.amazonaws.com
```

Build and tag images:

```bash
docker build -t student-timetable-backend:local ./backend
docker build --build-arg VITE_API_URL=/api -t student-timetable-frontend:local ./frontend

docker tag student-timetable-backend:local 153860374757.dkr.ecr.ap-southeast-1.amazonaws.com/student-timetable-backend:v1
docker tag student-timetable-frontend:local 153860374757.dkr.ecr.ap-southeast-1.amazonaws.com/student-timetable-frontend:v1
```

Push images:

```bash
docker push 153860374757.dkr.ecr.ap-southeast-1.amazonaws.com/student-timetable-backend:v1
docker push 153860374757.dkr.ecr.ap-southeast-1.amazonaws.com/student-timetable-frontend:v1
```

## Phase 2 - EKS cluster and core addons

Create the cluster from YAML:

```bash
eksctl create cluster -f infra/aws/eksctl/cluster.yaml
```

Check kube access:

```bash
kubectl get nodes
kubectl get pods -A
kubectl config current-context
```

Install Metrics Server:

```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
kubectl get pods -n kube-system | grep metrics-server
```

Install AWS Load Balancer Controller:

```bash
curl -O https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/main/docs/install/iam_policy.json

aws iam create-policy \
  --policy-name AWSLoadBalancerControllerIAMPolicy \
  --policy-document file://iam_policy.json

eksctl create iamserviceaccount \
  --cluster student-timetable-prod \
  --namespace kube-system \
  --name aws-load-balancer-controller \
  --region ap-southeast-1 \
  --attach-policy-arn arn:aws:iam::153860374757:policy/AWSLoadBalancerControllerIAMPolicy \
  --override-existing-serviceaccounts \
  --approve

helm repo add eks https://aws.github.io/eks-charts
helm repo update

helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=student-timetable-prod \
  --set serviceAccount.create=false \
  --set serviceAccount.name=aws-load-balancer-controller \
  --set region=ap-southeast-1 \
  --set vpcId=$(aws eks describe-cluster --name student-timetable-prod --region ap-southeast-1 --query "cluster.resourcesVpcConfig.vpcId" --output text)
```

## Phase 3 - RDS and app networking

RDS was created in the same VPC as EKS.
The effective check commands were:

```bash
aws eks describe-cluster --name student-timetable-prod --region ap-southeast-1 --query "cluster.resourcesVpcConfig.vpcId" --output text
aws rds describe-db-instances --db-instance-identifier student-timetable-prod-db --region ap-southeast-1 --query "DBInstances[0].DBSubnetGroup.VpcId" --output text
aws ec2 describe-security-groups --group-ids sg-09add986d99841264 --region ap-southeast-1 --query "SecurityGroups[0].[GroupId,GroupName,VpcId]" --output table
```

From inside the backend pod, the useful reachability checks were:

```bash
kubectl exec -it -n app <backend-pod> -- sh
nslookup student-timetable-prod-db.cnykqkqq86yr.ap-southeast-1.rds.amazonaws.com
nc -vz student-timetable-prod-db.cnykqkqq86yr.ap-southeast-1.rds.amazonaws.com 5432
```

## Phase 4 - backend deployment and Prisma

Inspect runtime environment:

```bash
kubectl exec -it -n app <backend-pod> -- printenv | grep DATABASE_URL
```

Run Prisma in the pod after RDS connectivity was fixed:

```bash
kubectl exec -it -n app <backend-pod> -- sh
npx prisma -v
npx prisma db push --schema prisma/schema.prisma
```

Expected successful message:

```text
Your database is now in sync with your Prisma schema.
```

## Phase 5 - ALB ingress and app verification

Ingress apply and watch:

```bash
kubectl apply -f infra/k8s/ingress/ingress.yaml
kubectl get ingress -n app -w
```

Smoke tests:

```bash
curl -I http://<ALB_HOSTNAME>/
curl -I http://<ALB_HOSTNAME>/api/health
```

Registration API test:

```bash
curl -i -X POST http://<ALB_HOSTNAME>/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"username":"test1","password":"123456","role":"STUDENT"}'
```

## Phase 6 - troubleshooting notes that mattered

### CORS mismatch
If browser requests failed but curl succeeded, the effective backend check was:

```bash
kubectl logs -n app deploy/backend --tail=200
```

The fix was to ensure `CORS_ORIGIN` included the active ALB hostname.

### Secret not found in new backend pods
The useful inspection commands were:

```bash
kubectl describe pod -n app <new-backend-pod>
kubectl get secret -n app backend-env
```

### Pod Identity and AWS provider checks

```bash
aws eks list-pod-identity-associations --cluster-name student-timetable-prod --region ap-southeast-1
kubectl -n kube-system get pods | grep -E 'csi-secrets-store|provider-aws|eks-pod-identity-agent'
kubectl -n kube-system logs -l app.kubernetes.io/name=eks-pod-identity-agent --tail=100
```

## Phase 7 - External Secrets Operator

Install ESO:

```bash
helm repo add external-secrets https://charts.external-secrets.io
helm repo update
helm install external-secrets external-secrets/external-secrets -n external-secrets --create-namespace
```

Create IAM role and policy for ESO controller using Pod Identity:

```bash
aws iam create-role --role-name ExternalSecretsPodIdentityRole --assume-role-policy-document file:///tmp/eso-pod-identity-trust.json
aws iam create-policy --policy-name ExternalSecretsReadBackendPolicy --policy-document file:///tmp/eso-secrets-policy.json
aws iam attach-role-policy --role-name ExternalSecretsPodIdentityRole --policy-arn arn:aws:iam::153860374757:policy/ExternalSecretsReadBackendPolicy
aws eks create-pod-identity-association --cluster-name student-timetable-prod --namespace external-secrets --service-account external-secrets --role-arn arn:aws:iam::153860374757:role/ExternalSecretsPodIdentityRole
```

Apply `SecretStore` and `ExternalSecret`:

```bash
kubectl apply -f infra/k8s/external-secrets/secretstore.yaml
kubectl apply -f infra/k8s/external-secrets/backend-external-secret.yaml
```

Verify ESO sync:

```bash
kubectl describe secretstore aws-secretsmanager -n app
kubectl get externalsecret -n app
kubectl describe externalsecret backend-env -n app
kubectl get secret -n app backend-env
```

Expected end state:
- SecretStore Ready=True
- ExternalSecret Ready=True
- `backend-env` exists as a Kubernetes Secret

## Phase 8 - steady-state checks

```bash
kubectl get pods -n app
kubectl get svc -n app
kubectl get endpoints -n app
kubectl get ingress -n app -o wide
kubectl logs -n app deploy/backend --tail=100
kubectl logs -n app deploy/frontend --tail=100
```

## Recommended cleanup after successful deployment

- Rotate any DB passwords and JWT secrets exposed during debugging.
- Set RDS back to private if it was temporarily made public.
- Remove temporary debug rules from the RDS security group.
- Keep one secret flow only:
  - either External Secrets -> Kubernetes Secret -> env vars
  - or CSI mount -> file-based secret consumption
- If backend no longer uses CSI, remove:
  - `infra/k8s/backend/secretproviderclass.yaml`
  - CSI volume mounts from backend deployment
  - `backend-secret-sync` temporary pod
