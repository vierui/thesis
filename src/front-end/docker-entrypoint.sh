#!/bin/sh
set -e

echo "🚀 Starting CITI Knowledge Management System..."

# Function to check database connectivity
check_database() {
  echo "📡 Checking database connectivity..."

  # Extract database host and port from DATABASE_URL
  # Format: postgresql://user:password@host:port/database
  DB_HOST=$(echo "$DATABASE_URL" | sed -n 's|.*@\([^:]*\):.*|\1|p')
  DB_PORT=$(echo "$DATABASE_URL" | sed -n 's|.*:\([0-9]*\)/.*|\1|p')

  if [ -z "$DB_HOST" ] || [ -z "$DB_PORT" ]; then
    echo "⚠️  Warning: Could not parse DATABASE_URL. Skipping connectivity check."
    return 0
  fi

  echo "   Database: $DB_HOST:$DB_PORT"

  # Wait for database to be ready (max 30 seconds)
  max_attempts=30
  attempt=0

  while [ $attempt -lt $max_attempts ]; do
    if nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null; then
      echo "✅ Database is reachable!"
      return 0
    fi

    attempt=$((attempt + 1))
    echo "   Waiting for database... (attempt $attempt/$max_attempts)"
    sleep 1
  done

  echo "❌ Error: Could not connect to database after $max_attempts seconds"
  exit 1
}

# Function to run database migrations
run_migrations() {
  echo "🔄 Running database migrations..."

  if npx prisma migrate deploy; then
    echo "✅ Migrations completed successfully!"
  else
    echo "❌ Error: Migration failed"
    exit 1
  fi
}

# Main execution
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  CITI Knowledge Management System"
echo "  Docker Container Initialization"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "⚠️  Warning: DATABASE_URL is not set. Skipping database operations."
else
  check_database
  
  # Only run migrations if explicitly enabled
  if [ "$RUN_MIGRATIONS" = "true" ]; then
    run_migrations
  else
    echo "⏭️  Skipping migrations (set RUN_MIGRATIONS=true to enable)"
  fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Initialization complete!"
echo "🌐 Starting Next.js production server..."
echo "   Listening on: ${HOSTNAME:-0.0.0.0}:${PORT:-3000}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Start the Next.js application using standalone server
exec node server.js
