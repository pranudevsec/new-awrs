-- Drop the existing User_tab table if it exists (optional)
DROP TABLE IF EXISTS User_tab;

-- Create the User_tab table
CREATE TABLE User_tab (
        user_id SERIAL PRIMARY KEY,
        pers_no VARCHAR NOT NULL,
        rank CHAR(16) NOT NULL,
        name VARCHAR NOT NULL,
        user_role VARCHAR NOT NULL,
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
    
        CONSTRAINT cw2_type_check CHECK (
          cw2_type IS NULL OR cw2_type IN ('mo', 'ol', 'hr', 'dv', 'mp')
        )
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

SELECT setval(
  pg_get_serial_sequence('"unit_tab"', 'unit_id'),
  COALESCE((SELECT MAX(unit_id) FROM "unit_tab"), 1)
);
SELECT setval(
  pg_get_serial_sequence('"User_tab"', 'user_id'),
  COALESCE((SELECT MAX(user_id) FROM "User_tab"), 1)
);
 -- Insert a sample user
 INSERT INTO User_tab (
    pers_no,
    rank,
    name,
    user_role,
    username,
    password,
    is_special_unit,
    is_member,
    is_officer,
    is_member_added
)
VALUES
  ('12345678', 'some', 'CO', 'unit', 'testuser1', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', FALSE, FALSE, FALSE, FALSE),
  ('87654321', 'some', 'CDR', 'brigade', 'testbrigade', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', FALSE, FALSE, TRUE, TRUE),
  ('56781234', 'some', 'DIV GOC', 'division', 'testdivision', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', FALSE, FALSE, TRUE, TRUE),
  ('43218765', 'some', 'CORPS CDR', 'corps', 'testcorps', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', FALSE, FALSE, TRUE, TRUE),
  ('34567812', 'some', 'GOC-in-C', 'command', 'testcommand', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', FALSE, FALSE, TRUE, TRUE),
  ('34567812', 'some', 'Admin', 'admin', 'admin', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', FALSE, FALSE, FALSE, FALSE),
  ('34567813', 'some', 'Headquarter', 'headquarter', 'testheadquarter', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', FALSE, FALSE, FALSE, FALSE),
  -- special unit user
  ('99999999', 'some', 'Spl Unit CO', 'unit', 'testspecialunit', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', TRUE, FALSE, FALSE, FALSE);

    INSERT INTO User_tab (
        pers_no,
        rank,
        name,
        user_role,
        username,
        password,
        is_special_unit,
        is_member,
        is_officer,
        officer_id
    )
    VALUES
      ('87654321', 'some', 'DY CDR', 'brigade', 'testbrigade_member', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', FALSE, TRUE, FALSE,2),
      ('56781234', 'some', 'DY GOC', 'division', 'testdivision_member', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', FALSE, TRUE, FALSE,3),
      ('43218765', 'some', 'COS', 'corps', 'testcorps_member', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', FALSE, TRUE, FALSE,4),
      ('34567812', 'some', 'COS', 'command', 'testcommand_member', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', FALSE, TRUE, FALSE,5);
      
    INSERT INTO User_tab (
        pers_no,
        rank,
        name,
        user_role,
        username,
        password,
        cw2_type,
        is_member,
        is_officer
    )
    VALUES
      ('11111111', 'some', 'CW2 MO User', 'cw2', 'testcw2_mo', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', 'mo', FALSE, FALSE),
      ('22222222', 'some', 'CW2 OL User', 'cw2', 'testcw2_ol', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', 'ol', FALSE, FALSE),
      ('33333333', 'some', 'CW2 HR User', 'cw2', 'testcw2_hr', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', 'hr', FALSE, FALSE),
      ('44444444', 'some', 'CW2 DV User', 'cw2', 'testcw2_dv', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', 'dv', FALSE, FALSE),
      ('55555555', 'some', 'CW2 MP User', 'cw2', 'testcw2_mp', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', 'mp', FALSE, FALSE);

--------------------------------------------------------------------------------------------Parameter_Master----------------------------------------------------------------------------------------------------------------------
-- Drop if exists
DROP TABLE IF EXISTS Parameter_Master;

-- Create the Parameter_Master table
CREATE TABLE Parameter_Master (
    param_id SERIAL PRIMARY KEY,
    comd CHAR(25),
    award_type CHAR(25) NOT NULL CHECK (award_type IN ('citation', 'appreciation')),
    applicability CHAR(4) NOT NULL,
    category CHAR(50),
    subcategory CHAR(50),
    subsubcategory CHAR(50),
    name CHAR(50),
    arms_service VARCHAR  NOT NULL,
    location  VARCHAR NOT NULL,
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
    deadline DATE,
    docu_path_base VARCHAR,
    cycle_period TEXT[],
    current_cycle_period VARCHAR
);

--------------------------------------------------------------------------------------------Unit_tab----------------------------------------------------------------------------------------------------------------------
-- Drop if exists
DROP TABLE IF EXISTS Unit_tab;

-- Create the Unit_tab table
CREATE TABLE Unit_tab (
    unit_id SERIAL PRIMARY KEY,
    sos_no CHAR(8),
    name VARCHAR,
    adm_channel VARCHAR,
    tech_channel VARCHAR,
    bde VARCHAR,
    div VARCHAR,
    corps VARCHAR,
    comd VARCHAR,
    unit_type VARCHAR,
    matrix_unit VARCHAR,
    location VARCHAR,
    awards JSONB DEFAULT '[]',
    members JSONB DEFAULT '[]',
    is_hr_review BOOLEAN DEFAULT FALSE,
is_dv_review BOOLEAN DEFAULT FALSE,
is_mp_review BOOLEAN DEFAULT FALSE,
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
    last_approved_by_role VARCHAR(50),
last_approved_at TIMESTAMP,
    status_flag VARCHAR(20) NOT NULL CHECK (
        status_flag IN ( 'in_review', 'in_clarification', 'approved', 'rejected','draft','shortlisted_approved','withdrawed')
    ),
    isShortlisted BOOLEAN DEFAULT FALSE,
    is_mo_approved BOOLEAN DEFAULT FALSE,
    mo_approved_at TIMESTAMP,
    is_ol_approved BOOLEAN DEFAULT FALSE,
    ol_approved_at TIMESTAMP,
    last_shortlisted_approved_role VARCHAR(50),
    unitRemarks TEXT, 
     remarks JSON ,
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
--------------------------------------------------------------------------------------------Appre_tab-------------------------------------------------------------------------------------------------------------------------------
-- Drop if exists
DROP TABLE IF EXISTS Appre_tab;

-- Create the Appre_tab table
CREATE TABLE Appre_tab (
    appreciation_id SERIAL PRIMARY KEY,
    unit_id INTEGER NOT NULL REFERENCES Unit_tab(unit_id),
    date_init DATE NOT NULL,
    appre_fds JSON NOT NULL, -- JSON and encrypted
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
    isShortlisted BOOLEAN DEFAULT FALSE ,
    last_shortlisted_approved_role VARCHAR(50),
    unitRemarks TEXT, 
     remarks JSON ,
      is_hr_review BOOLEAN DEFAULT FALSE,
is_dv_review BOOLEAN DEFAULT FALSE,
is_mp_review BOOLEAN DEFAULT FALSE,
last_rejected_by_role VARCHAR,
last_rejected_at TIMESTAMP,
    is_withdraw_requested BOOLEAN DEFAULT FALSE,
    withdraw_requested_by VARCHAR(50),
    withdraw_requested_at TIMESTAMP,
    withdraw_status VARCHAR(20) ,
    withdraw_requested_by_user_id INTEGER,
    withdraw_approved_by_role VARCHAR(50),
    withdraw_approved_by_user_id INTEGER,
    withdraw_approved_at TIMESTAMP
);

--------------------------------------------------------------------------------------------Clarification_tab-------------------------------------------------------------------------------------------------------------------------------
-- Drop the Clarification_tab table if it exists
DROP TABLE IF EXISTS Clarification_tab;

-- Create the Clarification_tab table
CREATE TABLE Clarification_tab (
    clarification_id SERIAL PRIMARY KEY,
    application_type VARCHAR(20) NOT NULL CHECK (application_type IN ('citation', 'appreciation')),
    application_id INTEGER NOT NULL,
    parameter_id INTEGER NOT NULL,
    parameter_name TEXT NOT NULL,

    clarification_by_id INTEGER NOT NULL,
    clarification_by_role VARCHAR(50) NOT NULL,
    
    clarification_status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'clarified', 'rejected'
    reviewer_comment TEXT,
    clarification TEXT,
    clarification_doc TEXT,
    clarified_history JSONB DEFAULT '[]',

    clarification_sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    clarified_at TIMESTAMP
);

-- Drop the signature_logs table if it exists
DROP TABLE IF EXISTS signature_logs;
-- Create the signature_logs table
CREATE TABLE signature_logs (
    id SERIAL PRIMARY KEY,
    application_id INTEGER NOT NULL,
    ic_number VARCHAR(100) NOT NULL,
    member_level VARCHAR(50) NOT NULL,
    status_flag VARCHAR(20) NOT NULL CHECK (
        status_flag IN ('approved', 'rejected')
    ),
    sign_digest TEXT NOT NULL,
    created_at TIMESTAMP default current_timestamp
);

CREATE EXTENSION IF NOT EXISTS vector;
DROP TABLE IF EXISTS documents;

CREATE TABLE documents (
  id SERIAL PRIMARY KEY,
  embedding vector(768),
  text TEXT,
  metadata JSONB
);


--------------------------------------------------------------------------------------------Insert Data----------------------------------------------------------------------------------------------------------------------

-- Insert dummy parameters
INSERT INTO Parameter_Master (
    comd, award_type, applicability, category, subcategory, subsubcategory, name,
    arms_service, location, description, negative, max_marks, proof_reqd,
    weightage, param_sequence, param_mark, per_unit_mark
) VALUES
('Northern Command', 'appreciation', 'ALL', 'recovery', '', '', 'Enemy Kills', 'ALL', 'ALL', 'Number of enemies neutralized', FALSE, 20, TRUE, 5, 1, 4, 4),
('Western Command', 'appreciation', 'ARMY', 'terrorist', '', '', 'Rescue Ops', 'ALL', 'ALL', 'Rescue operations conducted', FALSE, 15, TRUE, 4, 2, 5, 5),
('Northern Command', 'citation', 'ALL', 'Tenure', '', '', 'Tenure', 'ALL', 'ALL', 'Number of Tenure', FALSE, 25, TRUE, 5, 1, 5, 5),
('Northern Command', 'citation', 'ALL', 'Kills', '', '', 'Kills', 'ALL', 'ALL', 'Number of Kills', FALSE, 25, TRUE, 5, 1, 5, 5),
('Northern Command', 'citation', 'ALL', 'surrendered', '', '', 'surrendered', 'ALL', 'ALL', 'Number of surrendered', FALSE, 25, TRUE, 5, 1, 5, 5),
('Northern Command', 'citation', 'ALL', 'terrorist', '', '', 'Terrorist Killed', 'ALL', 'ALL', 'Number of terrorists neutralized (killed)', FALSE, 25, TRUE, 5, 1, 5, 5),
('Northern Command', 'citation', 'ALL', 'terrorist', '', '', 'Terrorist Apprehended with Weapon', 'ALL', 'ALL', 'Number of terrorists apprehended with weapon', FALSE, 20, TRUE, 4, 2, 4, 4),
('Northern Command', 'citation', 'ALL', 'terrorist', '', '', 'Terrorist Surrendered with Weapon', 'ALL', 'ALL', 'Number of terrorists surrendered with weapon', FALSE, 15, TRUE, 3, 3, 3, 3),
('Northern Command', 'citation', 'ALL', 'recovery', '', '', 'Heavy Weapon Recovery', 'ALL', 'ALL', 'Number of heavy weapons recovered', FALSE, 20, TRUE, 5, 1, 5, 5),
('Northern Command', 'citation', 'ALL', 'recovery', '', '', 'UMG Recovery', 'ALL', 'ALL', 'Number of UMGs recovered', FALSE, 15, TRUE, 4, 2, 4, 4),
('Northern Command', 'citation', 'ALL', 'recovery', '', '', 'Pistol Recovery', 'ALL', 'ALL', 'Number of pistols recovered', FALSE, 10, TRUE, 3, 3, 3, 3),
('Northern Command', 'citation', 'ALL', 'recovery', '', '', 'Radioset Recovery', 'ALL', 'ALL', 'Number of radiosets recovered', FALSE, 10, TRUE, 2, 4, 2, 2),
('Northern Command', 'appreciation', 'ALL', 'recovery', '', '', 'Medical Camps', 'ALL', 'ALL', 'Organized medical camps', FALSE, 10, FALSE, 3, 3, 2, 2);

INSERT INTO Config_tab (deadline, docu_path_base, cycle_period, current_cycle_period)
VALUES (
    '2025-12-31',
    '/mnt/data/documents',
    ARRAY['2024 - H1', '2024 - H2'],
    '2024 - H1'
);

-- Insert dummy data into Unit_tab
INSERT INTO Unit_tab (
    sos_no, name, adm_channel, tech_channel, bde, div, corps, comd
) VALUES (
    'A1234567', 'Unit Alpha', 'ADM-CH-1', 'TECH-CH-1', 'BDE-1', 'DIV-1', 'CORPS-1', 'Northern Command'
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


