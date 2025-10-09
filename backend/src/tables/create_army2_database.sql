-- Consolidated schema for army-2
-- Generated on Wed Oct  8 14:37:49 IST 2025

BEGIN;

-- Create new database army-2 with normalized structure
-- This script creates the new database and all normalized tables

-- ============================================
-- STEP 1: Create Database
-- ============================================

-- Drop database if exists (be careful!)
DROP DATABASE IF EXISTS "army-2";

-- Create new database
CREATE DATABASE "army-2";

-- Connect to the new database
\c "army-2";

-- ============================================
-- STEP 2: Create Reference Tables
-- ============================================

-- Command Reference Table
CREATE TABLE Command_Master (
    command_id SERIAL PRIMARY KEY,
    command_name VARCHAR(100) NOT NULL UNIQUE,
    command_code VARCHAR(10),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Brigade Reference Table  
CREATE TABLE Brigade_Master (
    brigade_id SERIAL PRIMARY KEY,
    brigade_name VARCHAR(100) NOT NULL,
    brigade_code VARCHAR(10),
    command_id INTEGER REFERENCES Command_Master(command_id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Division Reference Table
CREATE TABLE Division_Master (
    division_id SERIAL PRIMARY KEY,
    division_name VARCHAR(100) NOT NULL,
    division_code VARCHAR(10),
    command_id INTEGER REFERENCES Command_Master(command_id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Corps Reference Table
CREATE TABLE Corps_Master (
    corps_id SERIAL PRIMARY KEY,
    corps_name VARCHAR(100) NOT NULL,
    corps_code VARCHAR(10),
    command_id INTEGER REFERENCES Command_Master(command_id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Role Reference Table
CREATE TABLE Role_Master (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    role_code VARCHAR(10),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Deployment Reference Table
CREATE TABLE Deployment_Master (
    deployment_id SERIAL PRIMARY KEY,
    deployment_name VARCHAR(100) NOT NULL,
    deployment_code VARCHAR(10),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Arms Service Reference Table
CREATE TABLE Arms_Service_Master (
    arms_service_id SERIAL PRIMARY KEY,
    arms_service_name VARCHAR(100) NOT NULL,
    arms_service_code VARCHAR(10),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- STEP 3: Create Normalized Tables
-- ============================================

-- User_tab with normalized structure
CREATE TABLE User_tab (
    user_id SERIAL PRIMARY KEY,
    pers_no VARCHAR NOT NULL,
    rank CHAR(16) NOT NULL,
    name VARCHAR NOT NULL,
    username VARCHAR UNIQUE NOT NULL,
    password TEXT NOT NULL,
    unit_id INTEGER,
    cw2_type VARCHAR(2),
    is_special_unit BOOLEAN DEFAULT FALSE,
    is_member BOOLEAN DEFAULT FALSE, 
    officer_id INTEGER,
    is_officer BOOLEAN DEFAULT FALSE, 
    is_member_added BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key references
    role_id INTEGER REFERENCES Role_Master(role_id),
    
    CONSTRAINT cw2_type_check CHECK (
        cw2_type IS NULL OR cw2_type IN ('mo', 'ol', 'hr', 'dv', 'mp')
    )
);

-- Unit_tab with normalized structure
CREATE TABLE Unit_tab (
    unit_id SERIAL PRIMARY KEY,
    sos_no CHAR(8),
    name VARCHAR,
    adm_channel VARCHAR,
    tech_channel VARCHAR,
    unit_type VARCHAR,
    matrix_unit VARCHAR,
    location VARCHAR,
    awards JSONB DEFAULT '[]',
    members JSONB DEFAULT '[]',
    is_hr_review BOOLEAN DEFAULT FALSE,
    is_dv_review BOOLEAN DEFAULT FALSE,
    is_mp_review BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key references
    command_id INTEGER REFERENCES Command_Master(command_id),
    brigade_id INTEGER REFERENCES Brigade_Master(brigade_id),
    division_id INTEGER REFERENCES Division_Master(division_id),
    corps_id INTEGER REFERENCES Corps_Master(corps_id)
);

CREATE TABLE Unit_Members (
    member_id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- unique member ID
    unit_id INTEGER NOT NULL REFERENCES Unit_tab(unit_id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    rank VARCHAR,
    ic_number VARCHAR,
    appointment VARCHAR,
    member_type VARCHAR,       -- e.g., presiding_officer, regular_member
    member_order VARCHAR,      -- optional ordering field
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Parameter_Master with normalized structure
CREATE TABLE Parameter_Master (
    param_id SERIAL PRIMARY KEY,
    award_type CHAR(25) NOT NULL CHECK (award_type IN ('citation', 'appreciation')),
    applicability CHAR(4) NOT NULL,
    category CHAR(50),
    subcategory CHAR(50),
    subsubcategory CHAR(50),
    name CHAR(50),
    description VARCHAR NOT NULL,
    negative BOOLEAN NOT NULL,
    per_unit_mark INTEGER NOT NULL DEFAULT 1,
    max_marks INTEGER NOT NULL,
    proof_reqd BOOLEAN NOT NULL,
    weightage INTEGER NOT NULL,
    param_sequence INTEGER NOT NULL,
    param_mark INTEGER NOT NULL,
    
    -- Foreign key references
    command_id INTEGER REFERENCES Command_Master(command_id),
    arms_service_id INTEGER REFERENCES Arms_Service_Master(arms_service_id),
    deployment_id INTEGER REFERENCES Deployment_Master(deployment_id)
);

-- Citation_tab
CREATE TABLE Citation_tab (
    citation_id SERIAL PRIMARY KEY,
    unit_id INTEGER NOT NULL REFERENCES Unit_tab(unit_id),
    date_init DATE NOT NULL,
    citation_fds JSON NOT NULL,
    last_approved_by_role VARCHAR(50),
    last_approved_at TIMESTAMP,
    status_flag VARCHAR(20) NOT NULL CHECK (
        status_flag IN ('in_review', 'in_clarification', 'approved', 'rejected','draft','shortlisted_approved','withdrawed')
    ),
    isShortlisted BOOLEAN DEFAULT FALSE,
    is_mo_approved BOOLEAN DEFAULT FALSE,
    mo_approved_at TIMESTAMP,
    is_ol_approved BOOLEAN DEFAULT FALSE,
    ol_approved_at TIMESTAMP,
    last_shortlisted_approved_role VARCHAR(50),
    unitRemarks TEXT, 
    remarks JSON,
    is_hr_review BOOLEAN DEFAULT FALSE,
    is_dv_review BOOLEAN DEFAULT FALSE,
    is_mp_review BOOLEAN DEFAULT FALSE,
    last_rejected_by_role VARCHAR,
    last_rejected_at TIMESTAMP,
    isfinalized BOOLEAN DEFAULT FALSE,
    is_withdraw_requested BOOLEAN DEFAULT FALSE,
    withdraw_requested_by VARCHAR(50),
    withdraw_requested_at TIMESTAMP,
    withdraw_status VARCHAR(20),
    withdraw_requested_by_user_id INTEGER,
    withdraw_approved_by_role VARCHAR(50),
    withdraw_approved_by_user_id INTEGER,
    withdraw_approved_at TIMESTAMP
);

-- Appre_tab
CREATE TABLE Appre_tab (
    appreciation_id SERIAL PRIMARY KEY,
    unit_id INTEGER NOT NULL REFERENCES Unit_tab(unit_id),
    date_init DATE NOT NULL,
    appre_fds JSON NOT NULL,
    last_approved_by_role VARCHAR(50),
    last_approved_at TIMESTAMP,
    status_flag VARCHAR(20) NOT NULL CHECK (
        status_flag IN ('in_review','in_clarification', 'approved', 'rejected','draft','shortlisted_approved','withdrawed')
    ),
    is_mo_approved BOOLEAN DEFAULT FALSE,
    mo_approved_at TIMESTAMP,
    isfinalized BOOLEAN DEFAULT FALSE,
    is_ol_approved BOOLEAN DEFAULT FALSE,
    ol_approved_at TIMESTAMP,
    isShortlisted BOOLEAN DEFAULT FALSE,
    last_shortlisted_approved_role VARCHAR(50),
    unitRemarks TEXT, 
    is_vcoas BOOLEAN DEFAULT FALSE,
    remarks JSON,
    is_hr_review BOOLEAN DEFAULT FALSE,
    is_dv_review BOOLEAN DEFAULT FALSE,
    is_mp_review BOOLEAN DEFAULT FALSE,
    last_rejected_by_role VARCHAR,
    last_rejected_at TIMESTAMP,
    is_withdraw_requested BOOLEAN DEFAULT FALSE,
    withdraw_requested_by VARCHAR(50),
    withdraw_requested_at TIMESTAMP,
    withdraw_status VARCHAR(20),
    withdraw_requested_by_user_id INTEGER,
    withdraw_approved_by_role VARCHAR(50),
    withdraw_approved_by_user_id INTEGER,
    withdraw_approved_at TIMESTAMP
);

-- Clarification_tab
CREATE TABLE Clarification_tab (
    clarification_id SERIAL PRIMARY KEY,
    application_type VARCHAR(20) NOT NULL CHECK (application_type IN ('citation', 'appreciation')),
    application_id INTEGER NOT NULL,
    parameter_id INTEGER NOT NULL,
    parameter_name TEXT NOT NULL,
    clarification_by_id INTEGER NOT NULL,
    clarification_by_role VARCHAR(50) NOT NULL,
    clarification_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    reviewer_comment TEXT,
    clarification TEXT,
    clarification_doc TEXT,
    clarified_history JSONB DEFAULT '[]',
    clarification_sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    clarified_at TIMESTAMP
);

-- Config_tab
CREATE TABLE Config_tab (
    config_id SERIAL PRIMARY KEY,
    deadline DATE,
    docu_path_base VARCHAR,
    cycle_period TEXT[],
    current_cycle_period VARCHAR
);

-- Signature_logs
CREATE TABLE signature_logs (
    id SERIAL PRIMARY KEY,
    application_id INTEGER NOT NULL,
    ic_number VARCHAR(100) NOT NULL,
    member_level VARCHAR(50) NOT NULL,
    status_flag VARCHAR(20) NOT NULL CHECK (
        status_flag IN ('approved', 'rejected')
    ),
    sign_digest TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Documents table for chatbot
CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    embedding vector(768),
    text TEXT,
    metadata JSONB
);

-- ============================================
-- STEP 4: Create Indexes
-- ============================================

-- Indexes for performance
CREATE INDEX idx_parameter_master_command ON Parameter_Master(command_id);
CREATE INDEX idx_parameter_master_arms_service ON Parameter_Master(arms_service_id);
CREATE INDEX idx_parameter_master_deployment ON Parameter_Master(deployment_id);

CREATE INDEX idx_unit_tab_command ON Unit_tab(command_id);
CREATE INDEX idx_unit_tab_brigade ON Unit_tab(brigade_id);
CREATE INDEX idx_unit_tab_division ON Unit_tab(division_id);
CREATE INDEX idx_unit_tab_corps ON Unit_tab(corps_id);

CREATE INDEX idx_user_tab_role ON User_tab(role_id);

-- ============================================
-- STEP 5: Create Triggers
-- ============================================

-- Trigger function to update 'updated_at' column
CREATE OR REPLACE FUNCTION update_user_tab_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update 'updated_at' before each update
CREATE TRIGGER trg_update_user_tab_timestamp
BEFORE UPDATE ON User_tab
FOR EACH ROW
EXECUTE FUNCTION update_user_tab_timestamp();

-- ============================================
-- STEP 6: Create Helper Functions
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
-- STEP 7: Insert Reference Data
-- ============================================

-- Insert Commands
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

-- Insert Arms Services
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

-- Insert Roles
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

-- Insert Deployments
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
-- STEP 8: Verification
-- ============================================

-- Check that all tables are created
SELECT 'Database army-2 created successfully!' as status;

-- Check reference table counts
SELECT 'Command_Master' as table_name, COUNT(*) as record_count FROM Command_Master
UNION ALL
SELECT 'Arms_Service_Master' as table_name, COUNT(*) as record_count FROM Arms_Service_Master
UNION ALL
SELECT 'Deployment_Master' as table_name, COUNT(*) as record_count FROM Deployment_Master
UNION ALL
SELECT 'Role_Master' as table_name, COUNT(*) as record_count FROM Role_Master;


-- Ensure latest parameter tables

-- Drop existing Application_Parameter table if it exists
DROP TABLE IF EXISTS Application_Parameter CASCADE;

-- Create Citation_Parameter table
CREATE TABLE Citation_Parameter (
    citation_param_id SERIAL PRIMARY KEY,
    citation_id INTEGER NOT NULL REFERENCES Citation_tab(citation_id) ON DELETE CASCADE,
    parameter_id INTEGER NOT NULL REFERENCES Parameter_Master(param_id),
    parameter_name VARCHAR NOT NULL,
    parameter_value NUMERIC DEFAULT 0,
    parameter_count INTEGER DEFAULT 0,
    parameter_marks NUMERIC DEFAULT 0,
    parameter_upload TEXT,
    parameter_negative BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT FALSE,
    approved_by_user_id INTEGER REFERENCES User_tab(user_id),
    approved_by_role VARCHAR,
    approved_at TIMESTAMP,
    approved_marks NUMERIC,
    approved_count INTEGER,
    reviewer_comment TEXT,
    unit_comment TEXT,
    status VARCHAR DEFAULT 'pending', -- pending, approved, rejected, clarification_required
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- Create Appreciation_Parameter table
CREATE TABLE Appreciation_Parameter (
    appreciation_param_id SERIAL PRIMARY KEY,
    appreciation_id INTEGER NOT NULL REFERENCES Appre_tab(appreciation_id) ON DELETE CASCADE,
    parameter_id INTEGER NOT NULL REFERENCES Parameter_Master(param_id),
    parameter_name VARCHAR NOT NULL,
    parameter_value NUMERIC DEFAULT 0,
    parameter_count INTEGER DEFAULT 0,
    parameter_marks NUMERIC DEFAULT 0,
    parameter_upload TEXT,
    parameter_negative BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT FALSE,
    approved_by_user_id INTEGER REFERENCES User_tab(user_id),
    approved_by_role VARCHAR,
    approved_at TIMESTAMP,
    approved_marks NUMERIC,
    approved_count INTEGER,
    reviewer_comment TEXT,
    unit_comment TEXT,
    status VARCHAR DEFAULT 'pending', -- pending, approved, rejected, clarification_required
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- Create indexes for better performance
CREATE INDEX idx_citation_parameter_citation_id ON Citation_Parameter(citation_id);
CREATE INDEX idx_citation_parameter_param_id ON Citation_Parameter(parameter_id);
CREATE INDEX idx_appreciation_parameter_appreciation_id ON Appreciation_Parameter(appreciation_id);
CREATE INDEX idx_appreciation_parameter_param_id ON Appreciation_Parameter(parameter_id);

-- Add comments for documentation
COMMENT ON TABLE Citation_Parameter IS 'Stores parameter data for citation applications with proper references';
COMMENT ON TABLE Appreciation_Parameter IS 'Stores parameter data for appreciation applications with proper references';


-- Ensure period columns on unit_tab
ALTER TABLE IF EXISTS unit_tab ADD COLUMN IF NOT EXISTS start_month varchar NULL;
ALTER TABLE IF EXISTS unit_tab ADD COLUMN IF NOT EXISTS start_year varchar NULL;
ALTER TABLE IF EXISTS unit_tab ADD COLUMN IF NOT EXISTS end_month varchar NULL;
ALTER TABLE IF EXISTS unit_tab ADD COLUMN IF NOT EXISTS end_year varchar NULL;

COMMIT;

