-- Rollback script for normalization changes
-- This script reverts the database to its original state

-- ============================================
-- STEP 1: Restore original tables from backup
-- ============================================

-- Drop normalized tables if they exist
DROP TABLE IF EXISTS Parameter_Master CASCADE;
DROP TABLE IF EXISTS Unit_tab CASCADE;
DROP TABLE IF EXISTS User_tab CASCADE;
DROP TABLE IF EXISTS Citation_tab CASCADE;
DROP TABLE IF EXISTS Appre_tab CASCADE;
DROP TABLE IF EXISTS Clarification_tab CASCADE;
DROP TABLE IF EXISTS Config_tab CASCADE;

-- Restore from backup tables
CREATE TABLE Parameter_Master AS SELECT * FROM Parameter_Master_backup;
CREATE TABLE Unit_tab AS SELECT * FROM Unit_tab_backup;
CREATE TABLE User_tab AS SELECT * FROM User_tab_backup;
CREATE TABLE Citation_tab AS SELECT * FROM Citation_tab_backup;
CREATE TABLE Appre_tab AS SELECT * FROM Appre_tab_backup;
CREATE TABLE Clarification_tab AS SELECT * FROM Clarification_tab_backup;
CREATE TABLE Config_tab AS SELECT * FROM Config_tab_backup;

-- ============================================
-- STEP 2: Drop reference tables
-- ============================================

DROP TABLE IF EXISTS Command_Master CASCADE;
DROP TABLE IF EXISTS Brigade_Master CASCADE;
DROP TABLE IF EXISTS Division_Master CASCADE;
DROP TABLE IF EXISTS Corps_Master CASCADE;
DROP TABLE IF EXISTS Role_Master CASCADE;
DROP TABLE IF EXISTS Deployment_Master CASCADE;
DROP TABLE IF EXISTS Arms_Service_Master CASCADE;

-- ============================================
-- STEP 3: Drop views
-- ============================================

DROP VIEW IF EXISTS Parameter_Master_View CASCADE;
DROP VIEW IF EXISTS Unit_tab_View CASCADE;
DROP VIEW IF EXISTS User_tab_View CASCADE;

-- ============================================
-- STEP 4: Drop functions
-- ============================================

DROP FUNCTION IF EXISTS get_or_create_command(VARCHAR);
DROP FUNCTION IF EXISTS get_or_create_arms_service(VARCHAR);
DROP FUNCTION IF EXISTS get_or_create_deployment(VARCHAR);
DROP FUNCTION IF EXISTS get_or_create_role(VARCHAR);
DROP FUNCTION IF EXISTS update_parameter_master_fk();
DROP FUNCTION IF EXISTS update_unit_tab_fk();
DROP FUNCTION IF EXISTS update_user_tab_fk();

-- ============================================
-- STEP 5: Drop triggers
-- ============================================

DROP TRIGGER IF EXISTS trg_update_parameter_master_fk ON Parameter_Master;
DROP TRIGGER IF EXISTS trg_update_unit_tab_fk ON Unit_tab;
DROP TRIGGER IF EXISTS trg_update_user_tab_fk ON User_tab;

-- ============================================
-- STEP 6: Restore primary keys and constraints
-- ============================================

-- Restore primary keys
ALTER TABLE Parameter_Master ADD PRIMARY KEY (param_id);
ALTER TABLE Unit_tab ADD PRIMARY KEY (unit_id);
ALTER TABLE User_tab ADD PRIMARY KEY (user_id);
ALTER TABLE Citation_tab ADD PRIMARY KEY (citation_id);
ALTER TABLE Appre_tab ADD PRIMARY KEY (appreciation_id);
ALTER TABLE Clarification_tab ADD PRIMARY KEY (clarification_id);
ALTER TABLE Config_tab ADD PRIMARY KEY (config_id);

-- Restore foreign key constraints
ALTER TABLE Citation_tab ADD CONSTRAINT citation_tab_unit_id_fkey 
    FOREIGN KEY (unit_id) REFERENCES Unit_tab(unit_id);
ALTER TABLE Appre_tab ADD CONSTRAINT appre_tab_unit_id_fkey 
    FOREIGN KEY (unit_id) REFERENCES Unit_tab(unit_id);

-- Restore check constraints
ALTER TABLE Parameter_Master ADD CONSTRAINT parameter_master_award_type_check 
    CHECK (award_type IN ('citation', 'appreciation'));
ALTER TABLE Citation_tab ADD CONSTRAINT citation_tab_status_flag_check 
    CHECK (status_flag IN ('in_review', 'in_clarification', 'approved', 'rejected', 'draft', 'shortlisted_approved', 'withdrawed'));
ALTER TABLE Appre_tab ADD CONSTRAINT appre_tab_status_flag_check 
    CHECK (status_flag IN ('in_review', 'in_clarification', 'approved', 'rejected', 'draft', 'shortlisted_approved', 'withdrawed'));
ALTER TABLE Clarification_tab ADD CONSTRAINT clarification_tab_application_type_check 
    CHECK (application_type IN ('citation', 'appreciation'));
ALTER TABLE User_tab ADD CONSTRAINT cw2_type_check 
    CHECK (cw2_type IS NULL OR cw2_type IN ('mo', 'ol', 'hr', 'dv', 'mp'));

-- ============================================
-- STEP 7: Restore sequences
-- ============================================

-- Create sequences if they don't exist
CREATE SEQUENCE IF NOT EXISTS parameter_master_param_id_seq;
CREATE SEQUENCE IF NOT EXISTS unit_tab_unit_id_seq;
CREATE SEQUENCE IF NOT EXISTS user_tab_user_id_seq;
CREATE SEQUENCE IF NOT EXISTS citation_tab_citation_id_seq;
CREATE SEQUENCE IF NOT EXISTS appre_tab_appreciation_id_seq;
CREATE SEQUENCE IF NOT EXISTS clarification_tab_clarification_id_seq;
CREATE SEQUENCE IF NOT EXISTS config_tab_config_id_seq;

-- Set sequence values
SELECT setval('parameter_master_param_id_seq', COALESCE((SELECT MAX(param_id) FROM Parameter_Master), 1));
SELECT setval('unit_tab_unit_id_seq', COALESCE((SELECT MAX(unit_id) FROM Unit_tab), 1));
SELECT setval('user_tab_user_id_seq', COALESCE((SELECT MAX(user_id) FROM User_tab), 1));
SELECT setval('citation_tab_citation_id_seq', COALESCE((SELECT MAX(citation_id) FROM Citation_tab), 1));
SELECT setval('appre_tab_appreciation_id_seq', COALESCE((SELECT MAX(appreciation_id) FROM Appre_tab), 1));
SELECT setval('clarification_tab_clarification_id_seq', COALESCE((SELECT MAX(clarification_id) FROM Clarification_tab), 1));
SELECT setval('config_tab_config_id_seq', COALESCE((SELECT MAX(config_id) FROM Config_tab), 1));

-- ============================================
-- STEP 8: Verification
-- ============================================

-- Verify table counts match backup
SELECT 'Parameter_Master' as table_name, COUNT(*) as record_count FROM Parameter_Master
UNION ALL
SELECT 'Unit_tab' as table_name, COUNT(*) as record_count FROM Unit_tab
UNION ALL
SELECT 'User_tab' as table_name, COUNT(*) as record_count FROM User_tab
UNION ALL
SELECT 'Citation_tab' as table_name, COUNT(*) as record_count FROM Citation_tab
UNION ALL
SELECT 'Appre_tab' as table_name, COUNT(*) as record_count FROM Appre_tab
UNION ALL
SELECT 'Clarification_tab' as table_name, COUNT(*) as record_count FROM Clarification_tab
UNION ALL
SELECT 'Config_tab' as table_name, COUNT(*) as record_count FROM Config_tab;

-- ============================================
-- STEP 9: Cleanup backup tables (optional)
-- ============================================

-- Uncomment these lines if you want to remove backup tables after successful rollback
-- DROP TABLE IF EXISTS Parameter_Master_backup;
-- DROP TABLE IF EXISTS Unit_tab_backup;
-- DROP TABLE IF EXISTS User_tab_backup;
-- DROP TABLE IF EXISTS Citation_tab_backup;
-- DROP TABLE IF EXISTS Appre_tab_backup;
-- DROP TABLE IF EXISTS Clarification_tab_backup;
-- DROP TABLE IF EXISTS Config_tab_backup;
