#!/bin/bash

# Script to create army-2 database with normalized structure and copy Parameter_Master data

echo "🚀 Starting army-2 database creation and migration..."

# Check if PostgreSQL is running
if ! pg_isready -q; then
    echo "❌ PostgreSQL is not running. Please start PostgreSQL first."
    exit 1
fi

# Check if army database exists
if ! psql -U postgres -d army -c "SELECT 1;" > /dev/null 2>&1; then
    echo "❌ army database not found. Please ensure the army database exists."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Run the Node.js migration script
echo "📋 Running migration script..."
cd "$(dirname "$0")"
node create_army2_with_migration.js

if [ $? -eq 0 ]; then
    echo "🎉 army-2 database creation and migration completed successfully!"
    echo "📊 You can now connect to the army-2 database with: psql -U postgres -d army-2"
else
    echo "❌ Migration failed. Please check the error messages above."
    exit 1
fi
