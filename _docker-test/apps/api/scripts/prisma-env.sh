#!/bin/sh
set -eu

if [ -n "${DATABASE_URL:-}" ]; then
  export DATABASE_URL
elif [ -n "${POSTGRES_URL:-}" ]; then
  export DATABASE_URL="$POSTGRES_URL"
elif [ -n "${POSTGRES_PRISMA_URL:-}" ]; then
  export DATABASE_URL="$POSTGRES_PRISMA_URL"
elif [ -n "${PRIVATE_DATABASE_URL:-}" ]; then
  export DATABASE_URL="$PRIVATE_DATABASE_URL"
elif [ -n "${RAILWAY_DATABASE_URL:-}" ]; then
  export DATABASE_URL="$RAILWAY_DATABASE_URL"
fi

exec prisma migrate deploy
