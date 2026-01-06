#!/bin/bash
set -e

echo "Deploying application..."

git pull origin $(git branch --show-current)

docker compose pull
docker compose up -d --build

echo "Deploy completed"
