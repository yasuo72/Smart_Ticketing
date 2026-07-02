#!/bin/sh
set -eu

echo "Running database migrations..."
npm run db:deploy --workspace apps/api

echo "Starting API on ${HOST:-0.0.0.0}:${PORT:-4000}..."
exec node apps/api/dist/index.js
