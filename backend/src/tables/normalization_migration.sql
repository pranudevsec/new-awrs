-- Database Normalization Migration Script
-- This script creates reference tables and migrates existing data
-- Database: army (local)

-- ============================================
-- STEP 1: Create Reference Tables
-- ============================================

-- Command Reference Table
CREATE TABLE IF NOT EXISTS Command_Master (
    command_id SERIAL PRIMARY KEY,
    command_name VARCHAR(100) NOT NULL UNIQUE,
    command_code VARCHAR(10),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Brigade Reference Table  
CREATE TABLE IF NOT EXISTS Brigade_Master (
    brigade_id SERIAL PRIMARY KEY,
    brigade_name VARCHAR(100) NOT NULL,
    brigade_code VARCHAR(10),
    command_id INTEGER REFERENCES Command_Master(command_id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Division Reference Table
CREATE TABLE IF NOT EXISTS Division_Master (
    division_id SERIAL PRIMARY KEY,
    division_name VARCHAR(100) NOT NULL,
    division_code VARCHAR(10),
    command_id INTEGER REFERENCES Command_Master(command_id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Corps Reference Table
CREATE TABLE IF NOT EXISTS Corps_Master (
    corps_id SERIAL PRIMARY KEY,
    corps_name VARCHAR(100) NOT NULL,
    corps_code VARCHAR(10),
    command_id INTEGER REFERENCES Command_Master(command_id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Role Reference Table
CREATE TABLE IF NOT EXISTS Role_Master (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    role_code VARCHAR(10),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Deployment Reference Table
CREATE TABLE IF NOT EXISTS Deployment_Master (
    deployment_id SERIAL PRIMARY KEY,
    deployment_name VARCHAR(100) NOT NULL,
    deployment_code VARCHAR(10),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Arms Service Reference Table
CREATE TABLE IF NOT EXISTS Arms_Service_Master (
    arms_service_id SERIAL PRIMARY KEY,
    arms_service_name VARCHAR(100) NOT NULL,
    arms_service_code VARCHAR(10),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- STEP 2: Insert Reference Data
-- ============================================

-- Insert Commands (extract unique values from existing data)
INSERT INTO Command_Master (command_name, command_code) VALUES
('Northern Command', 'NC'),
('Western Command', 'WC'),
('Southern Command', 'SC'),
('Eastern Command', 'EC'),
('Central Command', 'CC'),
('South Western Command', 'SWC'),
('Training Command', 'TC'),
('Army Training Command', 'ATC')
ON CONFLICT (command_name) DO NOTHING;

-- Insert Arms Services (extract unique values from existing data)
INSERT INTO Arms_Service_Master (arms_service_name, arms_service_code) VALUES
('ALL', 'ALL'),
('ARMY', 'ARMY'),
('ARTY', 'ARTY'),
('ENG', 'ENG'),
('SIG', 'SIG'),
('MED', 'MED'),
('ORD', 'ORD'),
('EME', 'EME'),
('AOC', 'AOC'),
('ASC', 'ASC'),
('ADC', 'ADC'),
('JAG', 'JAG'),
('INT', 'INT'),
('MP', 'MP'),
('MIL', 'MIL'),
('HINTERLAND', 'HINTERLAND')
ON CONFLICT (arms_service_name) DO NOTHING;

-- Insert Roles (based on existing user roles)
INSERT INTO Role_Master (role_name, role_code) VALUES
('unit', 'UNIT'),
('brigade', 'BDE'),
('division', 'DIV'),
('corps', 'CORPS'),
('command', 'CMD'),
('admin', 'ADMIN'),
('headquarter', 'HQ'),
('cw2', 'CW2')
ON CONFLICT (role_name) DO NOTHING;

-- Insert Deployments (extract unique values from existing data)
INSERT INTO Deployment_Master (deployment_name, deployment_code) VALUES
('ALL', 'ALL'),
('HINTERLAND', 'HINTERLAND'),
('JAMMU', 'JAMMU'),
('KASHMIR', 'KASHMIR'),
('LADAKH', 'LADAKH'),
('PUNJAB', 'PUNJAB'),
('RAJASTHAN', 'RAJASTHAN'),
('GUJARAT', 'GUJARAT'),
('MAHARASHTRA', 'MAHARASHTRA'),
('KARNATAKA', 'KARNATAKA'),
('TAMIL NADU', 'TAMIL_NADU'),
('KERALA', 'KERALA'),
('ANDHRA PRADESH', 'ANDHRA_PRADESH'),
('TELANGANA', 'TELANGANA'),
('ODISHA', 'ODISHA'),
('WEST BENGAL', 'WEST_BENGAL'),
('ASSAM', 'ASSAM'),
('MANIPUR', 'MANIPUR'),
('NAGALAND', 'NAGALAND'),
('MIZORAM', 'MIZORAM'),
('TRIPURA', 'TRIPURA'),
('MEGHALAYA', 'MEGHALAYA'),
('ARUNACHAL PRADESH', 'ARUNACHAL_PRADESH'),
('SIKKIM', 'SIKKIM'),
('GOA', 'GOA'),
('DELHI', 'DELHI'),
('CHANDIGARH', 'CHANDIGARH'),
('PUDUCHERRY', 'PUDUCHERRY'),
('ANDAMAN AND NICOBAR', 'ANDAMAN_NICOBAR'),
('LAKSHADWEEP', 'LAKSHADWEEP'),
('DADRA AND NAGAR HAVELI', 'DADRA_NAGAR_HAVELI'),
('DAMAN AND DIU', 'DAMAN_DIU')
ON CONFLICT (deployment_name) DO NOTHING;

-- ============================================
-- STEP 3: Add Foreign Key Columns to Existing Tables
-- ============================================

-- Add foreign key columns to Parameter_Master
ALTER TABLE Parameter_Master 
ADD COLUMN IF NOT EXISTS command_id INTEGER REFERENCES Command_Master(command_id),
ADD COLUMN IF NOT EXISTS arms_service_id INTEGER REFERENCES Arms_Service_Master(arms_service_id),
ADD COLUMN IF NOT EXISTS deployment_id INTEGER REFERENCES Deployment_Master(deployment_id);

-- Add foreign key columns to Unit_tab
ALTER TABLE Unit_tab 
ADD COLUMN IF NOT EXISTS command_id INTEGER REFERENCES Command_Master(command_id),
ADD COLUMN IF NOT EXISTS brigade_id INTEGER REFERENCES Brigade_Master(brigade_id),
ADD COLUMN IF NOT EXISTS division_id INTEGER REFERENCES Division_Master(division_id),
ADD COLUMN IF NOT EXISTS corps_id INTEGER REFERENCES Corps_Master(corps_id);

-- Add foreign key column to User_tab
ALTER TABLE User_tab 
ADD COLUMN IF NOT EXISTS role_id INTEGER REFERENCES Role_Master(role_id);

-- ============================================
-- STEP 4: Migrate Existing Data
-- ============================================

-- Update Parameter_Master with foreign key references
UPDATE Parameter_Master 
SET command_id = (
    SELECT command_id FROM Command_Master 
    WHERE command_name = Parameter_Master.comd
)
WHERE comd IS NOT NULL;

UPDATE Parameter_Master 
SET arms_service_id = (
    SELECT arms_service_id FROM Arms_Service_Master 
    WHERE arms_service_name = Parameter_Master.arms_service
)
WHERE arms_service IS NOT NULL;

UPDATE Parameter_Master 
SET deployment_id = (
    SELECT deployment_id FROM Deployment_Master 
    WHERE deployment_name = Parameter_Master.location
)
WHERE location IS NOT NULL;

-- Update Unit_tab with foreign key references
UPDATE Unit_tab 
SET command_id = (
    SELECT command_id FROM Command_Master 
    WHERE command_name = Unit_tab.comd
)
WHERE comd IS NOT NULL;

-- Update User_tab with foreign key references
UPDATE User_tab 
SET role_id = (
    SELECT role_id FROM Role_Master 
    WHERE role_name = User_tab.user_role
)
WHERE user_role IS NOT NULL;

-- ============================================
-- STEP 5: Create Indexes for Performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_parameter_master_command ON Parameter_Master(command_id);
CREATE INDEX IF NOT EXISTS idx_parameter_master_arms_service ON Parameter_Master(arms_service_id);
CREATE INDEX IF NOT EXISTS idx_parameter_master_deployment ON Parameter_Master(deployment_id);

CREATE INDEX IF NOT EXISTS idx_unit_tab_command ON Unit_tab(command_id);
CREATE INDEX IF NOT EXISTS idx_unit_tab_brigade ON Unit_tab(brigade_id);
CREATE INDEX IF NOT EXISTS idx_unit_tab_division ON Unit_tab(division_id);
CREATE INDEX IF NOT EXISTS idx_unit_tab_corps ON Unit_tab(corps_id);

CREATE INDEX IF NOT EXISTS idx_user_tab_role ON User_tab(role_id);

-- ============================================
-- STEP 6: Create Views for Backward Compatibility
-- ============================================

-- View to maintain backward compatibility for Parameter_Master
CREATE OR REPLACE VIEW Parameter_Master_View AS
SELECT 
    pm.param_id,
    pm.comd,
    pm.award_type,
    pm.applicability,
    pm.category,
    pm.subcategory,
    pm.subsubcategory,
    pm.name,
    pm.arms_service,
    pm.location,
    pm.description,
    pm.negative,
    pm.per_unit_mark,
    pm.max_marks,
    pm.proof_reqd,
    pm.weightage,
    pm.param_sequence,
    pm.param_mark,
    pm.command_id,
    pm.arms_service_id,
    pm.deployment_id,
    cm.command_name,
    asm.arms_service_name,
    dm.deployment_name
FROM Parameter_Master pm
LEFT JOIN Command_Master cm ON pm.command_id = cm.command_id
LEFT JOIN Arms_Service_Master asm ON pm.arms_service_id = asm.arms_service_id
LEFT JOIN Deployment_Master dm ON pm.deployment_id = dm.deployment_id;

-- View to maintain backward compatibility for Unit_tab
CREATE OR REPLACE VIEW Unit_tab_View AS
SELECT 
    ut.unit_id,
    ut.sos_no,
    ut.name,
    ut.adm_channel,
    ut.tech_channel,
    ut.bde,
    ut.div,
    ut.corps,
    ut.comd,
    ut.unit_type,
    ut.matrix_unit,
    ut.location,
    ut.awards,
    ut.members,
    ut.is_hr_review,
    ut.is_dv_review,
    ut.is_mp_review,
    ut.created_at,
    ut.updated_at,
    ut.command_id,
    ut.brigade_id,
    ut.division_id,
    ut.corps_id,
    cm.command_name,
    bm.brigade_name,
    dm.division_name,
    crm.corps_name
FROM Unit_tab ut
LEFT JOIN Command_Master cm ON ut.command_id = cm.command_id
LEFT JOIN Brigade_Master bm ON ut.brigade_id = bm.brigade_id
LEFT JOIN Division_Master dm ON ut.division_id = dm.division_id
LEFT JOIN Corps_Master crm ON ut.corps_id = crm.corps_id;

-- View to maintain backward compatibility for User_tab
CREATE OR REPLACE VIEW User_tab_View AS
SELECT 
    ut.user_id,
    ut.pers_no,
    ut.rank,
    ut.name,
    ut.user_role,
    ut.username,
    ut.password,
    ut.unit_id,
    ut.cw2_type,
    ut.is_special_unit,
    ut.is_member,
    ut.officer_id,
    ut.is_officer,
    ut.is_member_added,
    ut.is_active,
    ut.created_at,
    ut.updated_at,
    ut.role_id,
    rm.role_name
FROM User_tab ut
LEFT JOIN Role_Master rm ON ut.role_id = rm.role_id;

-- ============================================
-- STEP 7: Create Functions for Data Management
-- ============================================

-- Function to get or create command
CREATE OR REPLACE FUNCTION get_or_create_command(command_name VARCHAR)
RETURNS INTEGER AS $$
DECLARE
    cmd_id INTEGER;
BEGIN
    SELECT command_id INTO cmd_id FROM Command_Master WHERE command_name = $1;
    
    IF cmd_id IS NULL THEN
        INSERT INTO Command_Master (command_name) VALUES ($1) RETURNING command_id INTO cmd_id;
    END IF;
    
    RETURN cmd_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get or create arms service
CREATE OR REPLACE FUNCTION get_or_create_arms_service(arms_service_name VARCHAR)
RETURNS INTEGER AS $$
DECLARE
    arms_id INTEGER;
BEGIN
    SELECT arms_service_id INTO arms_id FROM Arms_Service_Master WHERE arms_service_name = $1;
    
    IF arms_id IS NULL THEN
        INSERT INTO Arms_Service_Master (arms_service_name) VALUES ($1) RETURNING arms_service_id INTO arms_id;
    END IF;
    
    RETURN arms_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get or create deployment
CREATE OR REPLACE FUNCTION get_or_create_deployment(deployment_name VARCHAR)
RETURNS INTEGER AS $$
DECLARE
    dep_id INTEGER;
BEGIN
    SELECT deployment_id INTO dep_id FROM Deployment_Master WHERE deployment_name = $1;
    
    IF dep_id IS NULL THEN
        INSERT INTO Deployment_Master (deployment_name) VALUES ($1) RETURNING deployment_id INTO dep_id;
    END IF;
    
    RETURN dep_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get or create role
CREATE OR REPLACE FUNCTION get_or_create_role(role_name VARCHAR)
RETURNS INTEGER AS $$
DECLARE
    role_id INTEGER;
BEGIN
    SELECT role_id INTO role_id FROM Role_Master WHERE role_name = $1;
    
    IF role_id IS NULL THEN
        INSERT INTO Role_Master (role_name) VALUES ($1) RETURNING role_id INTO role_id;
    END IF;
    
    RETURN role_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 8: Create Triggers for Data Consistency
-- ============================================

-- Trigger to automatically update foreign keys when text fields change
CREATE OR REPLACE FUNCTION update_parameter_master_fk()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.comd IS NOT NULL AND (OLD.comd IS NULL OR NEW.comd != OLD.comd) THEN
        NEW.command_id := get_or_create_command(NEW.comd);
    END IF;
    
    IF NEW.arms_service IS NOT NULL AND (OLD.arms_service IS NULL OR NEW.arms_service != OLD.arms_service) THEN
        NEW.arms_service_id := get_or_create_arms_service(NEW.arms_service);
    END IF;
    
    IF NEW.location IS NOT NULL AND (OLD.location IS NULL OR NEW.location != OLD.location) THEN
        NEW.deployment_id := get_or_create_deployment(NEW.location);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_parameter_master_fk
    BEFORE INSERT OR UPDATE ON Parameter_Master
    FOR EACH ROW
    EXECUTE FUNCTION update_parameter_master_fk();

-- Trigger to automatically update foreign keys for Unit_tab
CREATE OR REPLACE FUNCTION update_unit_tab_fk()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.comd IS NOT NULL AND (OLD.comd IS NULL OR NEW.comd != OLD.comd) THEN
        NEW.command_id := get_or_create_command(NEW.comd);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_unit_tab_fk
    BEFORE INSERT OR UPDATE ON Unit_tab
    FOR EACH ROW
    EXECUTE FUNCTION update_unit_tab_fk();

-- Trigger to automatically update foreign keys for User_tab
CREATE OR REPLACE FUNCTION update_user_tab_fk()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.user_role IS NOT NULL AND (OLD.user_role IS NULL OR NEW.user_role != OLD.user_role) THEN
        NEW.role_id := get_or_create_role(NEW.user_role);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_user_tab_fk
    BEFORE INSERT OR UPDATE ON User_tab
    FOR EACH ROW
    EXECUTE FUNCTION update_user_tab_fk();

-- ============================================
-- STEP 9: Verification Queries
-- ============================================

-- Verify data migration
SELECT 'Parameter_Master Migration Check' as check_type, 
       COUNT(*) as total_records,
       COUNT(command_id) as command_fk_set,
       COUNT(arms_service_id) as arms_service_fk_set,
       COUNT(deployment_id) as deployment_fk_set
FROM Parameter_Master;

SELECT 'Unit_tab Migration Check' as check_type,
       COUNT(*) as total_records,
       COUNT(command_id) as command_fk_set
FROM Unit_tab;

SELECT 'User_tab Migration Check' as check_type,
       COUNT(*) as total_records,
       COUNT(role_id) as role_fk_set
FROM User_tab;

-- Check reference table counts
SELECT 'Command_Master' as table_name, COUNT(*) as record_count FROM Command_Master
UNION ALL
SELECT 'Arms_Service_Master' as table_name, COUNT(*) as record_count FROM Arms_Service_Master
UNION ALL
SELECT 'Deployment_Master' as table_name, COUNT(*) as record_count FROM Deployment_Master
UNION ALL
SELECT 'Role_Master' as table_name, COUNT(*) as record_count FROM Role_Master;

-- ============================================
-- STEP 10: Cleanup (Optional - Run after verification)
-- ============================================

-- Uncomment these lines after verifying the migration works correctly
-- and you want to remove the old text columns:

-- ALTER TABLE Parameter_Master DROP COLUMN IF EXISTS comd;
-- ALTER TABLE Parameter_Master DROP COLUMN IF EXISTS arms_service;
-- ALTER TABLE Parameter_Master DROP COLUMN IF EXISTS location;

-- ALTER TABLE Unit_tab DROP COLUMN IF EXISTS bde;
-- ALTER TABLE Unit_tab DROP COLUMN IF EXISTS div;
-- ALTER TABLE Unit_tab DROP COLUMN IF EXISTS corps;
-- ALTER TABLE Unit_tab DROP COLUMN IF EXISTS comd;

-- ALTER TABLE User_tab DROP COLUMN IF EXISTS user_role;
