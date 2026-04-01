#!/usr/bin/env bash
set -euo pipefail

REGION="${AWS_REGION:-ap-southeast-1}"
CLUSTER_NAME="${CLUSTER_NAME:-student-timetable-prod}"
NODEGROUP_NAME="${NODEGROUP_NAME:-app-ng}"
APP_NS="${APP_NS:-app}"
EXT_NS="${EXT_NS:-external-secrets}"
DB_ID="${DB_ID:-student-timetable-prod-db}"
BACKEND_ROLE="${BACKEND_ROLE:-StudentTimetableBackendPodIdentityRole}"
ESO_ROLE="${ESO_ROLE:-ExternalSecretsPodIdentityRole}"
BACKEND_POLICY="${BACKEND_POLICY:-StudentTimetableBackendSecretsPolicy}"
ESO_POLICY="${ESO_POLICY:-ExternalSecretsReadBackendPolicy}"
RDS_SG_ID="${RDS_SG_ID:-sg-045dd10be494a0e59}"
NODE_SG_ID="${NODE_SG_ID:-sg-09add986d99841264}"
SECRET_ID="${SECRET_ID:-student-timetable/backend1}"
BACKEND_REPO="${BACKEND_REPO:-student-timetable-backend}"
FRONTEND_REPO="${FRONTEND_REPO:-student-timetable-frontend}"
ACCOUNT_ID="${ACCOUNT_ID:-153860374757}"
ALB_INGRESS_NAME="${ALB_INGRESS_NAME:-app-ingress}"
BACKEND_DEPLOY="${BACKEND_DEPLOY:-backend}"
FRONTEND_DEPLOY="${FRONTEND_DEPLOY:-frontend}"
SECRETSTORE_NAME="${SECRETSTORE_NAME:-aws-secretsmanager}"
EXTERNALSECRET_NAME="${EXTERNALSECRET_NAME:-backend-env}"

say() { printf '\n\033[1;34m==> %s\033[0m\n' "$*"; }
run() { printf '\n$ %s\n' "$*"; bash -lc "$*" || true; }

say "AWS identity"
run "aws sts get-caller-identity"
run "aws configure list"

say "EKS cluster metadata"
run "aws eks describe-cluster --name '$CLUSTER_NAME' --region '$REGION' --query 'cluster.[name,status,version,endpoint,identity.oidc.issuer,resourcesVpcConfig.vpcId,resourcesVpcConfig.subnetIds]' --output json"
run "aws eks list-nodegroups --cluster-name '$CLUSTER_NAME' --region '$REGION'"
run "aws eks describe-nodegroup --cluster-name '$CLUSTER_NAME' --nodegroup-name '$NODEGROUP_NAME' --region '$REGION' --query 'nodegroup.[nodegroupName,status,nodeRole,subnets,scalingConfig,instanceTypes]' --output json"
run "aws eks list-pod-identity-associations --cluster-name '$CLUSTER_NAME' --region '$REGION'"

say "IAM roles and attached policies"
run "aws iam get-role --role-name '$BACKEND_ROLE'"
run "aws iam list-attached-role-policies --role-name '$BACKEND_ROLE'"
run "aws iam get-role --role-name '$ESO_ROLE'"
run "aws iam list-attached-role-policies --role-name '$ESO_ROLE'"
run "aws iam get-policy-version --policy-arn arn:aws:iam::$ACCOUNT_ID:policy/$BACKEND_POLICY --version-id \$(aws iam get-policy --policy-arn arn:aws:iam::$ACCOUNT_ID:policy/$BACKEND_POLICY --query 'Policy.DefaultVersionId' --output text)"
run "aws iam get-policy-version --policy-arn arn:aws:iam::$ACCOUNT_ID:policy/$ESO_POLICY --version-id \$(aws iam get-policy --policy-arn arn:aws:iam::$ACCOUNT_ID:policy/$ESO_POLICY --query 'Policy.DefaultVersionId' --output text)"

say "Networking and security groups"
run "aws ec2 describe-vpcs --vpc-ids \$(aws eks describe-cluster --name '$CLUSTER_NAME' --region '$REGION' --query 'cluster.resourcesVpcConfig.vpcId' --output text) --region '$REGION' --query 'Vpcs[0].[VpcId,CidrBlock]' --output table"
run "aws ec2 describe-security-groups --group-ids '$RDS_SG_ID' --region '$REGION' --output json"
run "aws ec2 describe-security-groups --group-ids '$NODE_SG_ID' --region '$REGION' --output json"

say "RDS metadata"
run "aws rds describe-db-instances --db-instance-identifier '$DB_ID' --region '$REGION' --query 'DBInstances[0].[DBInstanceIdentifier,DBInstanceStatus,Engine,EngineVersion,Endpoint.Address,Endpoint.Port,PubliclyAccessible,MasterUsername,DBName,DBSubnetGroup.VpcId,VpcSecurityGroups]' --output json"

say "Secrets Manager metadata"
run "aws secretsmanager describe-secret --secret-id '$SECRET_ID' --region '$REGION'"
run "aws secretsmanager get-secret-value --secret-id '$SECRET_ID' --region '$REGION' --query 'VersionStages'"

say "ECR repositories"
run "aws ecr describe-repositories --region '$REGION'"
run "aws ecr list-images --repository-name '$BACKEND_REPO' --region '$REGION'"
run "aws ecr list-images --repository-name '$FRONTEND_REPO' --region '$REGION'"

say "Kubernetes cluster state"
run "kubectl config current-context"
run "kubectl get nodes -o wide"
run "kubectl get pods -A"
run "kubectl get svc -A"
run "kubectl get ingress -A -o wide"
run "kubectl get deploy -A"
run "kubectl get rs -A"
run "kubectl get sa -A"
run "kubectl get secretproviderclass -A"
run "kubectl get externalsecret -A"
run "kubectl get secretstore -A"

say "Application namespace"
run "kubectl get all -n '$APP_NS'"
run "kubectl get endpoints -n '$APP_NS'"
run "kubectl get secret -n '$APP_NS'"
run "kubectl describe deployment '$BACKEND_DEPLOY' -n '$APP_NS'"
run "kubectl describe deployment '$FRONTEND_DEPLOY' -n '$APP_NS'"
run "kubectl describe ingress '$ALB_INGRESS_NAME' -n '$APP_NS'"
run "kubectl describe externalsecret '$EXTERNALSECRET_NAME' -n '$APP_NS'"
run "kubectl describe secretstore '$SECRETSTORE_NAME' -n '$APP_NS'"

say "Core controller logs"
run "kubectl logs -n kube-system deployment/aws-load-balancer-controller --tail=200"
run "kubectl -n kube-system get pods | grep -E 'csi-secrets-store|provider-aws|eks-pod-identity-agent'"
run "kubectl -n kube-system logs -l app.kubernetes.io/name=eks-pod-identity-agent --tail=100"
run "kubectl -n external-secrets get pods"
run "kubectl logs -n external-secrets deployment/external-secrets --tail=200"
run "kubectl logs -n '$APP_NS' deployment/$BACKEND_DEPLOY --tail=200"
run "kubectl logs -n '$APP_NS' deployment/$FRONTEND_DEPLOY --tail=200"

say "Public endpoint smoke test"
ALB_ADDR=$(kubectl get ingress "$ALB_INGRESS_NAME" -n "$APP_NS" -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null || true)
if [ -n "$ALB_ADDR" ]; then
  run "printf '%s\n' '$ALB_ADDR'"
  run "curl -I http://$ALB_ADDR/"
  run "curl -I http://$ALB_ADDR/api/health"
else
  echo "Ingress address not found"
fi

say "Backend to RDS network check"
BACKEND_POD=$(kubectl get pods -n "$APP_NS" -l app=backend -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || true)
if [ -n "$BACKEND_POD" ]; then
  DB_HOST=$(aws rds describe-db-instances --db-instance-identifier "$DB_ID" --region "$REGION" --query 'DBInstances[0].Endpoint.Address' --output text 2>/dev/null || true)
  run "kubectl exec -it -n '$APP_NS' '$BACKEND_POD' -- sh -c 'printenv | grep DATABASE_URL'"
  if [ -n "$DB_HOST" ]; then
    run "kubectl exec -it -n '$APP_NS' '$BACKEND_POD' -- sh -c 'nslookup $DB_HOST || true; nc -vz $DB_HOST 5432 || true'"
  fi
fi
