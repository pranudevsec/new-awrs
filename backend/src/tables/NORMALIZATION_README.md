# Database Normalization Migration Guide

## Overview
This migration normalizes the database structure by creating reference tables for commonly used values and replacing text fields with foreign key references. This improves data integrity, reduces redundancy, and makes the database more maintainable.

## What This Migration Does

### 1. Creates Reference Tables
- **Command_Master**: Stores command names (Northern Command, Western Command, etc.)
- **Brigade_Master**: Stores brigade information with command references
- **Division_Master**: Stores division information with command references  
- **Corps_Master**: Stores corps information with command references
- **Role_Master**: Stores user roles (unit, brigade, division, etc.)
- **Deployment_Master**: Stores deployment locations
- **Arms_Service_Master**: Stores arms service types (ALL, ARMY, ARTY, etc.)

### 2. Updates Existing Tables
- **Parameter_Master**: Adds foreign key columns for command, arms_service, and deployment
- **Unit_tab**: Adds foreign key columns for command, brigade, division, corps
- **User_tab**: Adds foreign key column for role

### 3. Preserves All Data
- All existing data (including 5567 Parameter_Master records) is preserved
- Original text columns are kept for backward compatibility
- Views are created to maintain existing functionality

## Files Created

1. **normalization_migration.sql** - Main migration script
2. **backup_before_normalization.sql** - Creates backup tables
3. **rollback_normalization.sql** - Reverts changes if needed
4. **run_normalization_migration.js** - Node.js script to run migration
5. **NORMALIZATION_README.md** - This documentation

## Migration Steps

### Step 1: Backup Current Data
```bash
# Connect to your local army database
psql -U postgres -d army

# Run backup script
\i backend/src/tables/backup_before_normalization.sql
```

### Step 2: Run Migration
```bash
# Option 1: Run via Node.js script
cd backend
node src/tables/run_normalization_migration.js

# Option 2: Run SQL directly
psql -U postgres -d army -f backend/src/tables/normalization_migration.sql
```

### Step 3: Verify Migration
The migration script includes verification queries that will show:
- Total records in each table
- Number of foreign keys set
- Count of records in reference tables

## Database Changes

### Before Normalization
```sql
-- Parameter_Master had text fields
comd VARCHAR(25)
arms_service VARCHAR
location VARCHAR

-- Unit_tab had text fields  
bde VARCHAR
div VARCHAR
corps VARCHAR
comd VARCHAR

-- User_tab had text field
user_role VARCHAR
```

### After Normalization
```sql
-- Parameter_Master has foreign keys + original text fields
command_id INTEGER REFERENCES Command_Master(command_id)
arms_service_id INTEGER REFERENCES Arms_Service_Master(arms_service_id)
deployment_id INTEGER REFERENCES Deployment_Master(deployment_id)
-- Original fields preserved: comd, arms_service, location

-- Unit_tab has foreign keys + original text fields
command_id INTEGER REFERENCES Command_Master(command_id)
brigade_id INTEGER REFERENCES Brigade_Master(brigade_id)
division_id INTEGER REFERENCES Division_Master(division_id)
corps_id INTEGER REFERENCES Corps_Master(corps_id)
-- Original fields preserved: bde, div, corps, comd

-- User_tab has foreign key + original text field
role_id INTEGER REFERENCES Role_Master(role_id)
-- Original field preserved: user_role
```

## Backward Compatibility

### Views Created
- **Parameter_Master_View**: Combines normalized data with original text fields
- **Unit_tab_View**: Combines normalized data with original text fields  
- **User_tab_View**: Combines normalized data with original text fields

### Functions Created
- `get_or_create_command(command_name)`: Gets or creates command
- `get_or_create_arms_service(arms_service_name)`: Gets or creates arms service
- `get_or_create_deployment(deployment_name)`: Gets or creates deployment
- `get_or_create_role(role_name)`: Gets or creates role

### Triggers Created
- Automatically update foreign keys when text fields change
- Maintain data consistency between text fields and foreign keys

## Rollback Process

If you need to revert the changes:

```bash
# Run rollback script
psql -U postgres -d army -f backend/src/tables/rollback_normalization.sql
```

This will:
1. Restore original tables from backup
2. Drop reference tables
3. Drop views and functions
4. Restore constraints and sequences

## Benefits of Normalization

1. **Data Integrity**: Foreign key constraints prevent invalid references
2. **Consistency**: Standardized values across all tables
3. **Maintainability**: Changes to command names only need to be made in one place
4. **Performance**: Better indexing and query performance
5. **Scalability**: Easier to add new commands, roles, etc.

## Important Notes

1. **No Data Loss**: All existing data is preserved
2. **Backward Compatible**: Original text fields are kept
3. **Gradual Migration**: You can update backend/frontend code gradually
4. **Local Database Only**: This migration is for your local army database only
5. **Parameter Master Preserved**: All 5567 records in Parameter_Master are preserved

## Next Steps After Migration

1. **Update Backend Code**: Modify services to use foreign keys
2. **Update Frontend Code**: Modify components to work with normalized data
3. **Test Thoroughly**: Ensure all functionality works with new structure
4. **Remove Text Columns**: After everything works, you can remove original text columns

## Troubleshooting

### Migration Fails
- Check database connection
- Ensure you have proper permissions
- Run backup script first
- Check for any existing reference tables

### Data Inconsistency
- Use verification queries to check data
- Check foreign key constraints
- Verify all records have proper references

### Performance Issues
- Check if indexes are created properly
- Monitor query performance
- Consider adding more indexes if needed

## Support

If you encounter issues:
1. Check the backup tables to ensure data is safe
2. Run verification queries to identify problems
3. Use rollback script if needed
4. Review error messages carefully

Remember: Your data is backed up, so you can always rollback if needed!
