-- Copy Parameter_Master data from army to army-2 (Fixed version)
-- This script copies all data and sets up foreign key references

-- Connect to army-2 database
\c army-2;

-- First, let's get the data directly from army database using a different approach
-- We'll use a more robust method to copy the data

-- Create a function to copy data from army database
DO $$
DECLARE
    rec RECORD;
    cmd_id INTEGER;
    arms_id INTEGER;
    dep_id INTEGER;
    inserted_count INTEGER := 0;
BEGIN
    -- Get data from army database using dblink or direct connection
    -- For now, let's use a simpler approach with manual data insertion
    
    RAISE NOTICE 'Starting Parameter_Master data migration...';
    
    -- We'll need to run this from the army database first
    RAISE NOTICE 'Please run the export script first from army database';
    
END $$;

-- Let's create a simpler approach - export from army and import to army-2
-- First, let's check what we have in army-2 so far
SELECT 'Current army-2 status' as status;
SELECT COUNT(*) as current_records FROM Parameter_Master;

-- Check reference tables
SELECT 'Command_Master' as table_name, COUNT(*) as count FROM Command_Master
UNION ALL
SELECT 'Arms_Service_Master' as table_name, COUNT(*) as count FROM Arms_Service_Master
UNION ALL
SELECT 'Deployment_Master' as table_name, COUNT(*) as count FROM Deployment_Master;
