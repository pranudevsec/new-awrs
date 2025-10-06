-- Copy Parameter_Master data from army to army-2
-- This script copies all data and sets up foreign key references

-- First, let's see what we have in the army database
\c army;

-- Create a temporary table with all Parameter_Master data
CREATE TEMP TABLE temp_parameter_export AS 
SELECT 
    param_id,
    comd,
    award_type,
    applicability,
    category,
    subcategory,
    subsubcategory,
    name,
    arms_service,
    location,
    description,
    negative,
    per_unit_mark,
    max_marks,
    proof_reqd,
    weightage,
    param_sequence,
    param_mark
FROM Parameter_Master 
ORDER BY param_id;

-- Export to CSV
\copy temp_parameter_export TO '/tmp/parameter_master_export.csv' WITH CSV HEADER;

-- Now connect to army-2 and import
\c army-2;

-- Create temporary import table
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
\copy temp_parameter_import FROM '/tmp/parameter_master_export.csv' WITH CSV HEADER;

-- Insert data with foreign key references
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
    -- Get or create command reference
    COALESCE(
        (SELECT command_id FROM Command_Master WHERE command_name = tpi.comd),
        (SELECT get_or_create_command(tpi.comd))
    ),
    -- Get or create arms service reference
    COALESCE(
        (SELECT arms_service_id FROM Arms_Service_Master WHERE arms_service_name = tpi.arms_service),
        (SELECT get_or_create_arms_service(tpi.arms_service))
    ),
    -- Get or create deployment reference
    COALESCE(
        (SELECT deployment_id FROM Deployment_Master WHERE deployment_name = tpi.location),
        (SELECT get_or_create_deployment(tpi.location))
    )
FROM temp_parameter_import tpi
ORDER BY tpi.param_id;

-- Update sequence
SELECT setval('parameter_master_param_id_seq', COALESCE((SELECT MAX(param_id) FROM Parameter_Master), 1));

-- Verification
SELECT 'Parameter_Master Migration Complete' as status,
       COUNT(*) as total_records,
       COUNT(command_id) as command_fk_set,
       COUNT(arms_service_id) as arms_service_fk_set,
       COUNT(deployment_id) as deployment_fk_set
FROM Parameter_Master;

-- Show sample data
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
LIMIT 5;
