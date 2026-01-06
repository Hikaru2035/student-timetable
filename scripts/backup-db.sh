#!/bin/bash
set -e

BACKUP_DIR=backups
DATE=$(date +"%Y%m%d_%H%M%S")

mkdir -p $BACKUP_DIR

docker compose exec -T postgres \
  pg_dump -U $POSTGRES_USER $POSTGRES_DB \
  > $BACKUP_DIR/db_$DATE.sql

echo "Backup saved: $BACKUP_DIR/db_$DATE.sql"
