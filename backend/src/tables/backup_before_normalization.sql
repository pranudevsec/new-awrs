-- Backup script before normalization
-- This script creates backup tables with all current data

-- Create backup of Parameter_Master
CREATE TABLE IF NOT EXISTS Parameter_Master_backup AS 
SELECT * FROM Parameter_Master;

-- Create backup of Unit_tab
CREATE TABLE IF NOT EXISTS Unit_tab_backup AS 
SELECT * FROM Unit_tab;

-- Create backup of User_tab
CREATE TABLE IF NOT EXISTS User_tab_backup AS 
SELECT * FROM User_tab;

-- Create backup of Citation_tab
CREATE TABLE IF NOT EXISTS Citation_tab_backup AS 
SELECT * FROM Citation_tab;

-- Create backup of Appre_tab
CREATE TABLE IF NOT EXISTS Appre_tab_backup AS 
SELECT * FROM Appre_tab;

-- Create backup of Clarification_tab
CREATE TABLE IF NOT EXISTS Clarification_tab_backup AS 
SELECT * FROM Clarification_tab;

-- Create backup of Config_tab
CREATE TABLE IF NOT EXISTS Config_tab_backup AS 
SELECT * FROM Config_tab;

-- Verify backup counts
SELECT 'Parameter_Master_backup' as table_name, COUNT(*) as record_count FROM Parameter_Master_backup
UNION ALL
SELECT 'Unit_tab_backup' as table_name, COUNT(*) as record_count FROM Unit_tab_backup
UNION ALL
SELECT 'User_tab_backup' as table_name, COUNT(*) as record_count FROM User_tab_backup
UNION ALL
SELECT 'Citation_tab_backup' as table_name, COUNT(*) as record_count FROM Citation_tab_backup
UNION ALL
SELECT 'Appre_tab_backup' as table_name, COUNT(*) as record_count FROM Appre_tab_backup
UNION ALL
SELECT 'Clarification_tab_backup' as table_name, COUNT(*) as record_count FROM Clarification_tab_backup
UNION ALL
SELECT 'Config_tab_backup' as table_name, COUNT(*) as record_count FROM Config_tab_backup;
