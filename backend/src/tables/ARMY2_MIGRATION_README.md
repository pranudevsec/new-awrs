# Army-2 Database Creation and Migration Guide

## Overview
This guide creates a new database `army-2` with a normalized structure and copies all Parameter_Master data from the existing `army` database with proper foreign key references.

## What This Does

### ✅ Creates New Database `army-2`
- Fresh database with normalized structure
- All reference tables (Command_Master, Arms_Service_Master, etc.)
- Proper foreign key relationships
- No data loss from original `army` database

### ✅ Copies Parameter_Master Data
- All 5567+ records from `army` database
- Sets up proper foreign key references
- Maintains data integrity
- Preserves all original data

### ✅ Normalized Structure
- **Command_Master**: Command references
- **Arms_Service_Master**: Arms service references  
- **Deployment_Master**: Location references
- **Role_Master**: User role references
- **Brigade_Master**: Brigade references
- **Division_Master**: Division references
- **Corps_Master**: Corps references

## Files Created

1. **create_army2_database.sql** - Creates army-2 database structure
2. **migrate_parameter_master_data.sql** - Copies Parameter_Master data
3. **create_army2_with_migration.js** - Automated migration script
4. **run_army2_migration.sh** - Shell script to run migration
5. **ARMY2_MIGRATION_README.md** - This documentation

## Prerequisites

1. **PostgreSQL running** on your local machine
2. **army database exists** with Parameter_Master data
3. **Node.js installed** for running the migration script
4. **Database credentials** (update password in scripts)

## Quick Start

### Option 1: Automated Migration (Recommended)
```bash
# Navigate to the tables directory
cd backend/src/tables

# Update password in create_army2_with_migration.js
# Change 'your_password_here' to your actual PostgreSQL password

# Run the migration
./run_army2_migration.sh
```

### Option 2: Manual Migration
```bash
# 1. Create army-2 database structure
psql -U postgres -f create_army2_database.sql

# 2. Copy Parameter_Master data
psql -U postgres -d army -f migrate_parameter_master_data.sql
```

### Option 3: Node.js Script Only
```bash
# Update password in create_army2_with_migration.js
# Then run:
node create_army2_with_migration.js
```

## Database Structure

### Before (army database)
```sql
Parameter_Master:
- comd VARCHAR(25)           -- Text field
- arms_service VARCHAR       -- Text field  
- location VARCHAR           -- Text field
```

### After (army-2 database)
```sql
Parameter_Master:
- command_id INTEGER REFERENCES Command_Master(command_id)
- arms_service_id INTEGER REFERENCES Arms_Service_Master(arms_service_id)
- deployment_id INTEGER REFERENCES Deployment_Master(deployment_id)
```

### Reference Tables Created
```sql
Command_Master:
- command_id (PK)
- command_name (Northern Command, Western Command, etc.)

Arms_Service_Master:
- arms_service_id (PK)
- arms_service_name (ALL, ARMY, ARTY, etc.)

Deployment_Master:
- deployment_id (PK)
- deployment_name (ALL, HINTERLAND, JAMMU, etc.)

Role_Master:
- role_id (PK)
- role_name (unit, brigade, division, etc.)

Brigade_Master:
- brigade_id (PK)
- brigade_name
- command_id (FK)

Division_Master:
- division_id (PK)
- division_name
- command_id (FK)

Corps_Master:
- corps_id (PK)
- corps_name
- command_id (FK)
```

## Migration Process

### Step 1: Database Creation
- Creates `army-2` database
- Sets up all reference tables
- Inserts reference data
- Creates indexes and constraints

### Step 2: Data Migration
- Connects to `army` database
- Retrieves all Parameter_Master records
- Maps text fields to foreign key references
- Inserts data into `army-2` with proper relationships

### Step 3: Verification
- Checks record counts match
- Verifies foreign key integrity
- Shows reference table statistics
- Confirms data migration success

## Verification Queries

After migration, you can run these queries to verify:

```sql
-- Connect to army-2 database
\c army-2

-- Check total records
SELECT COUNT(*) FROM Parameter_Master;

-- Check foreign key integrity
SELECT 
    COUNT(*) as total_records,
    COUNT(command_id) as command_fk_set,
    COUNT(arms_service_id) as arms_service_fk_set,
    COUNT(deployment_id) as deployment_fk_set
FROM Parameter_Master;

-- Check reference tables
SELECT 'Command_Master' as table, COUNT(*) as count FROM Command_Master
UNION ALL
SELECT 'Arms_Service_Master' as table, COUNT(*) as count FROM Arms_Service_Master
UNION ALL
SELECT 'Deployment_Master' as table, COUNT(*) as count FROM Deployment_Master;

-- Sample data with references
SELECT 
    pm.param_id,
    pm.name,
    cm.command_name,
    asm.arms_service_name,
    dm.deployment_name
FROM Parameter_Master pm
LEFT JOIN Command_Master cm ON pm.command_id = cm.command_id
LEFT JOIN Arms_Service_Master asm ON pm.arms_service_id = asm.arms_service_id
LEFT JOIN Deployment_Master dm ON pm.deployment_id = dm.deployment_id
ORDER BY pm.param_id
LIMIT 10;
```

## Benefits of army-2 Database

### ✅ Data Integrity
- Foreign key constraints prevent invalid references
- Referential integrity maintained
- No orphaned records

### ✅ Normalized Structure
- No duplicate data
- Consistent naming
- Proper relationships

### ✅ Performance
- Better indexing
- Faster queries
- Optimized joins

### ✅ Maintainability
- Single source of truth for commands, roles, etc.
- Easy to add new commands/roles
- Consistent data across tables

## Troubleshooting

### Common Issues

1. **PostgreSQL not running**
   ```bash
   # Start PostgreSQL service
   brew services start postgresql  # macOS
   sudo service postgresql start   # Linux
   ```

2. **Permission denied**
   ```bash
   # Make script executable
   chmod +x run_army2_migration.sh
   ```

3. **Database connection failed**
   - Check PostgreSQL is running
   - Verify username/password
   - Ensure army database exists

4. **Migration fails**
   - Check error messages
   - Verify army database has Parameter_Master data
   - Check disk space

### Rollback

If you need to start over:
```bash
# Drop army-2 database
psql -U postgres -c "DROP DATABASE IF EXISTS \"army-2\";"

# Run migration again
./run_army2_migration.sh
```

## Next Steps

After successful migration:

1. **Update Backend Code**: Modify services to use army-2 database
2. **Update Frontend Code**: Modify components to work with normalized data
3. **Test Functionality**: Ensure all features work with new structure
4. **Performance Testing**: Verify query performance improvements

## Support

If you encounter issues:
1. Check PostgreSQL is running
2. Verify army database exists and has data
3. Check error messages in the migration output
4. Ensure you have proper database permissions

The migration is designed to be safe and can be run multiple times if needed.
