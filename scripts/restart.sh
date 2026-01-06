#!/bin/bash
set -e

echo "Restarting services..."
docker compose restart
echo "Restart done"
