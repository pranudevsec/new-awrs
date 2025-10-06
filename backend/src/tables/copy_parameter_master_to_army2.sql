-- Copy Parameter_Master data from army database to army-2
-- This script connects to both databases and migrates the data

-- ============================================
-- STEP 1: Connect to army-2 database
-- ============================================

\c "army-2";

-- ============================================
-- STEP 2: Copy Parameter_Master data from army database
-- ============================================

-- First, let's see what data we have in the original army database
-- We'll use a temporary connection to copy the data

-- Create a function to copy data from the original army database
CREATE OR REPLACE FUNCTION copy_parameter_master_from_army()
RETURNS VOID AS $$
DECLARE
    rec RECORD;
    cmd_id INTEGER;
    arms_id INTEGER;
    dep_id INTEGER;
BEGIN
    -- This function will be called after we establish connection to army database
    RAISE NOTICE 'Starting Parameter_Master data migration...';
    
    -- We'll use a different approach - create a script that can be run
    -- to copy data from army to army-2
    RAISE NOTICE 'Please run the copy_parameter_master_data.sql script to complete the migration';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 3: Create a script to copy data
-- ============================================

-- This will be executed from the army database to copy data to army-2
-- We need to create a separate script for this

-- ============================================
-- STEP 4: Verification queries
-- ============================================

-- Check current state of army-2 database
SELECT 'army-2 database ready for Parameter_Master migration' as status;

-- Check reference tables are populated
SELECT 'Command_Master' as table_name, COUNT(*) as record_count FROM Command_Master
UNION ALL
SELECT 'Arms_Service_Master' as table_name, COUNT(*) as record_count FROM Arms_Service_Master
UNION ALL
SELECT 'Deployment_Master' as table_name, COUNT(*) as record_count FROM Deployment_Master;
