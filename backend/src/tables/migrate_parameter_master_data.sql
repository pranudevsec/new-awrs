-- Migrate Parameter_Master data from army to army-2
-- This script copies all Parameter_Master data and sets up foreign key references

-- ============================================
-- STEP 1: Connect to army database and export data
-- ============================================

\c army;

-- Create a temporary table with all Parameter_Master data
CREATE TEMP TABLE temp_parameter_master AS 
SELECT * FROM Parameter_Master;

-- Export the data to a file (this will be used to import into army-2)
\copy temp_parameter_master TO '/tmp/parameter_master_data.csv' WITH CSV HEADER;

-- ============================================
-- STEP 2: Connect to army-2 database
-- ============================================

\c "army-2";

-- ============================================
-- STEP 3: Import and process Parameter_Master data
-- ============================================

-- Create a temporary table to import the data
CREATE TEMP TABLE temp_parameter_import (
    param_id INTEGER,
    comd VARCHAR,
    award_type VARCHAR,
    applicability VARCHAR,
    category VARCHAR,
    subcategory VARCHAR,
    subsubcategory VARCHAR,
    name VARCHAR,
    arms_service VARCHAR,
    location VARCHAR,
    description VARCHAR,
    negative BOOLEAN,
    per_unit_mark INTEGER,
    max_marks INTEGER,
    proof_reqd BOOLEAN,
    weightage INTEGER,
    param_sequence INTEGER,
    param_mark INTEGER
);

-- Import the data
\copy temp_parameter_import FROM '/tmp/parameter_master_data.csv' WITH CSV HEADER;

-- ============================================
-- STEP 4: Insert data into Parameter_Master with foreign key references
-- ============================================

-- Insert data with proper foreign key references
INSERT INTO Parameter_Master (
    param_id,
    award_type,
    applicability,
    category,
    subcategory,
    subsubcategory,
    name,
    description,
    negative,
    per_unit_mark,
    max_marks,
    proof_reqd,
    weightage,
    param_sequence,
    param_mark,
    command_id,
    arms_service_id,
    deployment_id
)
SELECT 
    tpi.param_id,
    tpi.award_type,
    tpi.applicability,
    tpi.category,
    tpi.subcategory,
    tpi.subsubcategory,
    tpi.name,
    tpi.description,
    tpi.negative,
    tpi.per_unit_mark,
    tpi.max_marks,
    tpi.proof_reqd,
    tpi.weightage,
    tpi.param_sequence,
    tpi.param_mark,
    -- Set foreign key references
    COALESCE(cm.command_id, get_or_create_command(tpi.comd)),
    COALESCE(asm.arms_service_id, get_or_create_arms_service(tpi.arms_service)),
    COALESCE(dm.deployment_id, get_or_create_deployment(tpi.location))
FROM temp_parameter_import tpi
LEFT JOIN Command_Master cm ON cm.command_name = tpi.comd
LEFT JOIN Arms_Service_Master asm ON asm.arms_service_name = tpi.arms_service
LEFT JOIN Deployment_Master dm ON dm.deployment_name = tpi.location
ORDER BY tpi.param_id;

-- ============================================
-- STEP 5: Update sequence to match the highest param_id
-- ============================================

-- Set the sequence to the correct value
SELECT setval('parameter_master_param_id_seq', COALESCE((SELECT MAX(param_id) FROM Parameter_Master), 1));

-- ============================================
-- STEP 6: Verification
-- ============================================

-- Check total records migrated
SELECT 'Parameter_Master Migration Complete' as status,
       COUNT(*) as total_records,
       COUNT(command_id) as command_fk_set,
       COUNT(arms_service_id) as arms_service_fk_set,
       COUNT(deployment_id) as deployment_fk_set
FROM Parameter_Master;

-- Check for any records without foreign keys
SELECT 'Records without foreign keys' as check_type,
       COUNT(*) as count
FROM Parameter_Master 
WHERE command_id IS NULL OR arms_service_id IS NULL OR deployment_id IS NULL;

-- Show sample of migrated data
SELECT 'Sample migrated data' as check_type,
       param_id,
       category,
       name,
       cm.command_name,
       asm.arms_service_name,
       dm.deployment_name
FROM Parameter_Master pm
LEFT JOIN Command_Master cm ON pm.command_id = cm.command_id
LEFT JOIN Arms_Service_Master asm ON pm.arms_service_id = asm.arms_service_id
LEFT JOIN Deployment_Master dm ON pm.deployment_id = dm.deployment_id
ORDER BY param_id
LIMIT 10;

-- ============================================
-- STEP 7: Cleanup
-- ============================================

-- Drop temporary table
DROP TABLE IF EXISTS temp_parameter_import;

-- ============================================
-- STEP 8: Final verification
-- ============================================

-- Verify all data is properly migrated
SELECT 'Final Verification' as status;

-- Check record counts match
SELECT 'army-2 Parameter_Master' as database, COUNT(*) as record_count FROM Parameter_Master;

-- Check foreign key integrity
SELECT 'Foreign Key Integrity Check' as check_type,
       'Command references' as fk_type,
       COUNT(*) as total,
       COUNT(command_id) as with_fk,
       COUNT(*) - COUNT(command_id) as missing_fk
FROM Parameter_Master
UNION ALL
SELECT 'Foreign Key Integrity Check' as check_type,
       'Arms Service references' as fk_type,
       COUNT(*) as total,
       COUNT(arms_service_id) as with_fk,
       COUNT(*) - COUNT(arms_service_id) as missing_fk
FROM Parameter_Master
UNION ALL
SELECT 'Foreign Key Integrity Check' as check_type,
       'Deployment references' as fk_type,
       COUNT(*) as total,
       COUNT(deployment_id) as with_fk,
       COUNT(*) - COUNT(deployment_id) as missing_fk
FROM Parameter_Master;

-- Show reference table counts
SELECT 'Reference Tables' as check_type,
       'Command_Master' as table_name,
       COUNT(*) as record_count
FROM Command_Master
UNION ALL
SELECT 'Reference Tables' as check_type,
       'Arms_Service_Master' as table_name,
       COUNT(*) as record_count
FROM Arms_Service_Master
UNION ALL
SELECT 'Reference Tables' as check_type,
       'Deployment_Master' as table_name,
       COUNT(*) as record_count
FROM Deployment_Master;
