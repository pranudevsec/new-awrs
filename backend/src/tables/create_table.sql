-- Drop the existing User_tab table if it exists (optional)
DROP TABLE IF EXISTS User_tab;

-- Create the User_tab table
CREATE TABLE User_tab (
    user_id SERIAL PRIMARY KEY,
    pers_no CHAR(8) NOT NULL,
    rank CHAR(8) NOT NULL,
    name VARCHAR NOT NULL,
    user_role VARCHAR NOT NULL,
    username VARCHAR UNIQUE NOT NULL,
    password TEXT NOT NULL, -- Assume it's encrypted with AES-256
    unit_id INTEGER,

    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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

-- Insert a sample user
INSERT INTO User_tab (pers_no, rank, name, user_role, username, password)
VALUES ('12345678', 'some', 'John Doe', 'unit', 'testuser1', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq');

--------------------------------------------------------------------------------------------Parameter_Master----------------------------------------------------------------------------------------------------------------------
-- Drop if exists
DROP TABLE IF EXISTS Parameter_Master;

-- Create the Parameter_Master table
CREATE TABLE Parameter_Master (
    param_id SERIAL PRIMARY KEY,
    comd CHAR(3) NOT NULL,
    award_type CHAR(25) NOT NULL CHECK (award_type IN ('citation', 'appreciation')),
    applicability CHAR(4) NOT NULL,
    name CHAR(25) NOT NULL,
    description VARCHAR NOT NULL,
    negative BOOLEAN NOT NULL,
    per_unit_mark INTEGER NOT NULL DEFAULT 1,
    max_marks INTEGER NOT NULL,
    proof_reqd BOOLEAN NOT NULL,
    weightage INTEGER NOT NULL,
    param_sequence INTEGER NOT NULL,
    param_mark INTEGER NOT NULL
);

--------------------------------------------------------------------------------------------Config_tab----------------------------------------------------------------------------------------------------------------------
-- Drop if exists
DROP TABLE IF EXISTS Config_tab;

-- Create the Config_tab table
CREATE TABLE Config_tab (
    config_id SERIAL PRIMARY KEY,
    deadline DATE NOT NULL,
    docu_path_base VARCHAR NOT NULL
);

--------------------------------------------------------------------------------------------Unit_tab----------------------------------------------------------------------------------------------------------------------
-- Drop if exists
DROP TABLE IF EXISTS Unit_tab;

-- Create the Unit_tab table
CREATE TABLE Unit_tab (
    unit_id SERIAL PRIMARY KEY,
    sos_no CHAR(8),
    name VARCHAR NOT NULL,
    adm_channel VARCHAR,
    tech_channel VARCHAR,
    bde VARCHAR,
    div VARCHAR,
    corps VARCHAR,
    comd VARCHAR,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

--------------------------------------------------------------------------------------------Citation_tab----------------------------------------------------------------------------------------------------------------------
-- Drop if exists
DROP TABLE IF EXISTS Citation_tab;

-- Create the Citation_tab table
CREATE TABLE Citation_tab (
    citation_id SERIAL PRIMARY KEY,
    unit_id INTEGER NOT NULL REFERENCES Unit_tab(unit_id),
    date_init DATE NOT NULL,
    citation_fds JSON NOT NULL,  -- Assumed to be stored in encrypted format at the app layer
    status_flag VARCHAR(20) NOT NULL CHECK (
        status_flag IN ( 'in_review', 'in_clarification', 'approved', 'rejected')
    )
);
--------------------------------------------------------------------------------------------Appre_tab-------------------------------------------------------------------------------------------------------------------------------
-- Drop if exists
DROP TABLE IF EXISTS Appre_tab;

-- Create the Appre_tab table
CREATE TABLE Appre_tab (
    appreciation_id SERIAL PRIMARY KEY,
    unit_id INTEGER NOT NULL REFERENCES Unit_tab(unit_id),
    date_init DATE NOT NULL,
    appre_fds JSON NOT NULL, -- JSON and encrypted
     status_flag VARCHAR(20) NOT NULL CHECK (
        status_flag IN ('in_review','in_clarification', 'approved', 'rejected')
    )
);

--------------------------------------------------------------------------------------------Clarification_tab-------------------------------------------------------------------------------------------------------------------------------
-- Drop the Clarification_tab table if it exists
DROP TABLE IF EXISTS Clarification_tab;

-- Create the Clarification_tab table
CREATE TABLE Clarification_tab (
    clarification_id SERIAL PRIMARY KEY,
    
    -- Auto-generated application ID (6-digit numeric as string)
    application_id CHAR(6) UNIQUE NOT NULL,

    -- award_type: citation or appreciation
    award_type CHAR(12) NOT NULL CHECK (award_type IN ('citation', 'appreciation')),

    -- Foreign key references
    unit_id INTEGER NOT NULL REFERENCES Unit_tab(unit_id),
    created_by_id INTEGER NOT NULL REFERENCES User_tab(user_id),
    created_by_role VARCHAR(20) NOT NULL,  -- e.g., 'bridge', 'division'

    -- Tab ID reference (Appre_tab or Citation_tab)
    fds_tab_id INTEGER NOT NULL,

    -- Parameter under review
    parameter_name CHAR(25) NOT NULL,

    -- Reviewer's comment (display only)
    review_comment TEXT NOT NULL,

    -- Document uploaded as clarification
    clarification_doc VARCHAR,

    -- User's clarification comment
    clarification_comment TEXT,

    -- Status of the clarification
    status VARCHAR(20) DEFAULT 'pending' CHECK (
        status IN ('pending', 'responded', 'reviewed', 'resolved', 'rejected')
    ),

    -- Audit fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

--------------------------------------------------------------------------------------------Insert Data----------------------------------------------------------------------------------------------------------------------

-- Insert dummy parameters
INSERT INTO Parameter_Master (
    comd, award_type, applicability, name, description, negative,
    max_marks, proof_reqd, weightage, param_sequence, param_mark, per_unit_mark
) VALUES
('NC', 'citation', 'ALL', 'Enemy Kills', 'Number of enemies neutralized', FALSE, 20, TRUE, 5, 1, 4, 4),
('WC', 'citation', 'ARMY', 'Rescue Ops', 'Rescue operations conducted', FALSE, 15, TRUE, 4, 2, 5, 5),
('SC', 'appreciation', 'ALL', 'Medical Camps', 'Organized medical camps', FALSE, 10, FALSE, 3, 3, 2, 2);

INSERT INTO Config_tab (deadline, docu_path_base)
VALUES ('2025-12-31', '/mnt/data/documents');

-- Insert dummy data into Unit_tab
INSERT INTO Unit_tab (
    sos_no, name, adm_channel, tech_channel, bde, div, corps, comd
) VALUES (
    'A1234567', 'Unit Alpha', 'ADM-CH-1', 'TECH-CH-1', 'BDE-1', 'DIV-1', 'CORPS-1', 'NC'
);

-- Insert for Citation_tab
INSERT INTO Citation_tab (unit_id, date_init, citation_fds, status_flag)
VALUES (
    1,
    '2024-04-01',
    '{
        "award_type": "citation",
        "cycle_period": "2024 - H1",
        "last_date": "2025-04-15",
        "parameters": [
            {
                "name": "Enemy Kills",
                "count": 5,
                "marks": 20,
                "upload": "uploads/enemy_kills_file1.pdf"
            },
            {
                "name": "Rescue Ops",
                "count": 2,
                "marks": 4,
                "upload": "uploads/param1_file.pdf"
            }
        ]
    }'::json,
    'in_review'
);

-- Insert for Appre_tab
INSERT INTO Appre_tab ( unit_id, date_init, appre_fds, status_flag)
VALUES (
    1,
    '2024-04-01',
    '{
        "award_type": "appreciation",
        "cycle_period": "2024 - H1",
        "last_date": "2025-04-15",
        "parameters": [
            {
                "name": "Medical Camps",
                "count": 3,
                "marks": 6,
                "upload": "uploads/medical_camps_file.pdf"
            },
            {
                "name": "Community Service",
                "count": 1,
                "marks": 4,
                "upload": "uploads/community_service_file.pdf"
            }
        ]
    }'::json,
    'in_review'
);

INSERT INTO User_tab (pers_no, rank, name, user_role, username, password)
VALUES ('12345678', 'some', 'Reviewer Alpha', 'bridge', 'testuser2', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq');

-- Insert into Clarification_tab for a citation parameter
INSERT INTO Clarification_tab (
    application_id, award_type, unit_id, created_by_id, created_by_role,
    fds_tab_id, parameter_name, review_comment, clarification_doc,
    clarification_comment, status
) VALUES (
    '000001',                       -- 6-digit application ID
    'citation',
    1,                              -- Unit ID from Unit_tab
    1,                              -- User ID from User_tab
    'bridge',                       -- Created by role
    1,                              -- fds_tab_id (Citation_tab id)
    'Enemy Kills',                 -- parameter from citation_fds
    'Please explain how kills were verified.',
    'uploads/enemy_kills_clarification.pdf',
    'Kills confirmed via enemy radio intercepts.',
    'responded'
);

-- Insert into Clarification_tab for an appreciation parameter
INSERT INTO Clarification_tab (
    application_id, award_type, unit_id, created_by_id, created_by_role,
    fds_tab_id, parameter_name, review_comment, clarification_doc,
    clarification_comment, status
) VALUES (
    '000002',
    'appreciation',
    1,
    1,
    'division',
    1,                             
    'Medical Camps',
    'Clarify the number of beneficiaries attended.',
    'uploads/medical_camps_clarification.pdf',
    'Total of 180 civilians attended across 3 camps.',
    'responded'
);