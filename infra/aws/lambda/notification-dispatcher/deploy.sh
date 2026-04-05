#!/usr/bin/env bash
set -euo pipefail

FUNCTION_NAME="${FUNCTION_NAME:-student-timetable-notification-dispatcher}"
REGION="${AWS_REGION:-ap-southeast-1}"
ROLE_ARN="${LAMBDA_ROLE_ARN:?LAMBDA_ROLE_ARN is required}"
WORKDIR="$(cd "$(dirname "$0")" && pwd)"
BUILD_DIR="${WORKDIR}/build"
ZIP_FILE="${WORKDIR}/notification-dispatcher.zip"

rm -rf "$BUILD_DIR" "$ZIP_FILE"
mkdir -p "$BUILD_DIR"
cp "$WORKDIR/index.mjs" "$BUILD_DIR/"
cp "$WORKDIR/package.json" "$BUILD_DIR/"

cd "$BUILD_DIR"
npm install --omit=dev
zip -r "$ZIP_FILE" .

if aws lambda get-function --function-name "$FUNCTION_NAME" --region "$REGION" >/dev/null 2>&1; then
  aws lambda update-function-code \
    --function-name "$FUNCTION_NAME" \
    --zip-file "fileb://$ZIP_FILE" \
    --region "$REGION"
else
  aws lambda create-function \
    --function-name "$FUNCTION_NAME" \
    --runtime nodejs20.x \
    --handler index.handler \
    --zip-file "fileb://$ZIP_FILE" \
    --role "$ROLE_ARN" \
    --timeout 30 \
    --memory-size 512 \
    --environment "Variables={AWS_REGION=$REGION}" \
    --region "$REGION"
fi
