#!/bin/sh
set -eu

npm run db:deploy --workspace apps/api
exec node apps/api/dist/index.js
