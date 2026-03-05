#!/bin/sh
set -e

echo "Running database migrations..."
npx prisma migrate deploy

echo "Running seed..."
node prisma/seed.js

echo "Starting server..."
node dist/index.js
