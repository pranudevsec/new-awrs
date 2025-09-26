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

DROP TABLE IF EXISTS Config_tab;

-- Create the Config_tab table
CREATE TABLE Config_tab (
    config_id SERIAL PRIMARY KEY,
    deadline DATE,
    docu_path_base VARCHAR,
    cycle_period TEXT[],
    current_cycle_period VARCHAR
);


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

SELECT setval('user_tab_user_id_seq', (SELECT MAX(user_id) FROM User_tab));
SELECT setval('unit_tab_unit_id_seq', (SELECT MAX(unit_id) FROM unit_tab));

INSERT INTO User_tab VALUES (6, '34567812', 'some    ', 'Admin', 'admin', 'admin', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', NULL, NULL, false, false, NULL, false, false, true, '2025-07-15 20:37:28.179856', '2025-07-15 20:37:28.179856');
INSERT INTO User_tab VALUES (7, '34567813', 'some    ', 'Headquarter', 'headquarter', 'testheadquarter', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', NULL, NULL, false, false, NULL, false, false, true, '2025-07-15 20:37:28.179856', '2025-07-15 20:37:28.179856');
INSERT INTO User_tab VALUES (8, '99999999', 'some    ', 'Spl Unit CO', 'unit', 'testspecialunit', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', NULL, NULL, true, false, NULL, false, false, true, '2025-07-15 20:37:28.179856', '2025-07-15 20:37:28.179856');
INSERT INTO User_tab VALUES (9, '87654321', 'some    ', 'AAG', 'brigade', 'testbrigade_member', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', NULL, NULL, false, true, 2, false, false, true, '2025-07-15 20:37:28.191118', '2025-07-15 20:37:28.191118');
INSERT INTO User_tab VALUES (10, '56781234', 'some    ', 'Col A (Div)', 'division', 'testdivision_member', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', NULL, NULL, false, true, 3, false, false, true, '2025-07-15 20:37:28.191118', '2025-07-15 20:37:28.191118');
INSERT INTO User_tab VALUES (11, '43218765', 'some    ', 'Col A (Corps)', 'corps', 'testcorps_member', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', NULL, NULL, false, true, 4, false, false, true, '2025-07-15 20:37:28.191118', '2025-07-15 20:37:28.191118');
INSERT INTO User_tab VALUES (12, '34567812', 'some    ', 'Col A (Comd)', 'command', 'testcommand_member', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', NULL, NULL, false, true, 5, false, false, true, '2025-07-15 20:37:28.191118', '2025-07-15 20:37:28.191118');
INSERT INTO User_tab VALUES (15, '33333333', 'some    ', 'CW2 HR User', 'cw2', 'testcw2_hr', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', NULL, 'hr', false, false, NULL, false, false, true, '2025-07-15 20:37:28.194814', '2025-07-15 20:37:28.194814');
INSERT INTO User_tab VALUES (16, '44444444', 'some    ', 'CW2 DV User', 'cw2', 'testcw2_dv', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', NULL, 'dv', false, false, NULL, false, false, true, '2025-07-15 20:37:28.194814', '2025-07-15 20:37:28.194814');
INSERT INTO User_tab VALUES (17, '55555555', 'some    ', 'CW2 MP User', 'cw2', 'testcw2_mp', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', NULL, 'mp', false, false, NULL, false, false, true, '2025-07-15 20:37:28.194814', '2025-07-15 20:37:28.194814');
INSERT INTO User_tab VALUES (18, '12345678', 'some    ', 'Reviewer Alpha', 'bridge', 'testuser2', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', NULL, NULL, false, false, NULL, false, false, true, '2025-07-15 20:37:28.469522', '2025-07-15 20:37:28.469522');
INSERT INTO User_tab VALUES (1, '12345678', 'some    ', 'CO', 'unit', 'testunit1', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', 2, NULL, false, false, NULL, false, false, true, '2025-07-15 20:37:28.179856', '2025-07-15 20:48:41.095602');
INSERT INTO User_tab VALUES (2, '87654321', 'some    ', 'CDR', 'brigade', 'testbrigade', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', 3, NULL, false, false, NULL, true, true, true, '2025-07-15 20:37:28.179856', '2025-07-15 21:03:36.013711');
INSERT INTO User_tab VALUES (3, '56781234', 'some    ', 'DIV GOC', 'division', 'testdivision', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', 4, NULL, false, false, NULL, true, true, true, '2025-07-15 20:37:28.179856', '2025-07-17 22:56:00.851661');
INSERT INTO User_tab VALUES (4, '43218765', 'some    ', 'CORPS CDR', 'corps', 'testcorps', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', 5, NULL, false, false, NULL, true, true, true, '2025-07-15 20:37:28.179856', '2025-07-18 19:47:20.624527');
INSERT INTO User_tab VALUES (5, '34567812', 'some    ', 'GOC-in-C', 'command', 'testcommand', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', 6, NULL, false, false, NULL, true, true, true, '2025-07-15 20:37:28.179856', '2025-07-18 19:48:44.204581');
INSERT INTO User_tab VALUES (13, '11111111', 'some    ', 'CW2 MO User', 'cw2', 'testcw2_mo', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', 7, 'mo', false, false, NULL, false, false, true, '2025-07-15 20:37:28.194814', '2025-07-18 22:03:58.24706');
INSERT INTO User_tab VALUES (14, '22222222', 'some    ', 'CW2 OL User', 'cw2', 'testcw2_ol', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', 8, 'ol', false, false, NULL, false, false, true, '2025-07-15 20:37:28.194814', '2025-07-19 23:07:43.96847');
INSERT INTO User_tab VALUES (26, '7536223 ', 'CO      ', 'CO', 'unit', 'unit8', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', NULL, NULL, false, false, NULL, false, false, true, '2025-07-27 12:09:07.582193', '2025-07-27 12:09:07.582193');
INSERT INTO User_tab VALUES (27, '9579556 ', 'CO      ', 'Co', 'unit', 'unit9', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', NULL, NULL, false, false, NULL, false, false, true, '2025-07-27 12:09:34.88363', '2025-07-27 12:09:34.88363');
INSERT INTO User_tab VALUES (28, '3928797 ', 'CO      ', 'CO', 'unit', 'unit10', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', NULL, NULL, false, false, NULL, false, false, true, '2025-07-27 12:10:05.604611', '2025-07-27 12:10:05.604611');
INSERT INTO User_tab VALUES (29, '1158764 ', 'CO      ', 'CO', 'unit', 'unit11', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', NULL, NULL, false, false, NULL, false, false, true, '2025-07-27 12:10:34.857066', '2025-07-27 12:10:34.857066');
INSERT INTO User_tab VALUES (30, '2364946 ', 'CO      ', 'CO', 'unit', 'unit12', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', NULL, NULL, false, false, NULL, false, false, true, '2025-07-27 12:10:58.234665', '2025-07-27 12:10:58.234665');
INSERT INTO User_tab VALUES (35, '8797829 ', 'CDR     ', 'CDR', 'brigade', 'bde3', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', NULL, NULL, false, false, NULL, false, false, true, '2025-07-27 12:14:54.645154', '2025-07-27 12:14:54.645154');
INSERT INTO User_tab VALUES (37, '3426194 ', 'CDR     ', 'CDR', 'brigade', 'bde4', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', NULL, NULL, false, false, NULL, false, false, true, '2025-07-27 12:15:43.359666', '2025-07-27 12:15:43.359666');
INSERT INTO User_tab VALUES (41, '1846547 ', 'DIV GOC ', 'DIV GOC', 'division', 'div2', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', NULL, NULL, false, false, NULL, false, false, true, '2025-07-27 12:18:02.924686', '2025-07-27 12:18:02.924686');
INSERT INTO User_tab VALUES (43, '7434002 ', 'DIV GOC ', 'DIV GOC', 'division', 'div3', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', NULL, NULL, false, false, NULL, false, false, true, '2025-07-27 12:19:00.298344', '2025-07-27 12:19:00.298344');
INSERT INTO User_tab VALUES (47, '1790449 ', 'CORPS C ', 'CORPS CDR', 'corps', 'corps2', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', NULL, NULL, false, false, NULL, false, false, true, '2025-07-27 12:21:26.434073', '2025-07-27 12:21:26.434073');
INSERT INTO User_tab VALUES (20, '2400826 ', 'CO      ', 'CO', 'unit', 'unit2', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', 10, NULL, false, false, NULL, false, false, true, '2025-07-27 12:06:32.466313', '2025-07-27 13:05:17.463645');
INSERT INTO User_tab VALUES (22, '4994927 ', 'CO      ', 'CO', 'unit', 'unit4', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', 12, NULL, false, false, NULL, false, false, true, '2025-07-27 12:07:20.732191', '2025-07-27 13:09:09.984428');
INSERT INTO User_tab VALUES (23, '1923615 ', 'CO      ', 'CO', 'unit', 'unit5', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', 13, NULL, false, false, NULL, false, false, true, '2025-07-27 12:07:48.326667', '2025-07-27 13:11:01.542334');
INSERT INTO User_tab VALUES (24, '1052614 ', 'CO      ', 'CO', 'unit', 'unit6', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', 14, NULL, false, false, NULL, false, false, true, '2025-07-27 12:08:11.156901', '2025-07-27 13:12:53.019649');
INSERT INTO User_tab VALUES (25, '7109625 ', 'CO      ', 'CO', 'unit', 'unit7', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', 15, NULL, false, false, NULL, false, false, true, '2025-07-27 12:08:37.337739', '2025-07-27 13:14:37.294499');
INSERT INTO User_tab VALUES (31, '5628146 ', 'CDR     ', 'CDR', 'brigade', 'bde1', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', 16, NULL, false, false, NULL, false, true, true, '2025-07-27 12:11:59.989562', '2025-07-27 13:15:52.415612');
INSERT INTO User_tab VALUES (33, '9890959 ', 'CDR     ', 'CDR', 'brigade', 'bde2', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', 17, NULL, false, false, NULL, false, true, true, '2025-07-27 12:14:03.882564', '2025-07-27 13:22:56.674804');
INSERT INTO User_tab VALUES (39, '1428481 ', 'DIV GOS ', 'DIV GOC', 'division', 'div1', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', 18, NULL, false, false, NULL, false, true, true, '2025-07-27 12:17:08.36756', '2025-07-27 13:28:57.523669');
INSERT INTO User_tab VALUES (45, '2724902 ', 'CORPS C ', 'CORPS CDR', 'corps', 'corps1', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', 19, NULL, false, false, NULL, false, true, true, '2025-07-27 12:20:28.494464', '2025-07-27 13:32:19.262108');
INSERT INTO User_tab VALUES (32, '5273174 ', 'AAG  ', 'AAG', 'brigade', 'bde1_member', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', NULL, NULL, false, true, 31, false, false, true, '2025-07-27 12:13:42.930595', '2025-07-27 14:07:03.581031');
INSERT INTO User_tab VALUES (51, '8557716 ', 'GOC-in-C', 'GOC-in-C', 'command', 'scomd', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', NULL, NULL, false, false, NULL, false, false, true, '2025-07-27 12:24:01.547788', '2025-07-27 12:24:01.547788');
INSERT INTO User_tab VALUES (53, '9010503 ', 'GOC-in-C', 'GOC-in-C', 'command', 'ccomd', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', NULL, NULL, false, false, NULL, false, false, true, '2025-07-27 12:24:57.718066', '2025-07-27 12:24:57.718066');
INSERT INTO User_tab VALUES (57, '2051974 ', 'GOC-in-C', 'GOC-in-C', 'command', 'ecomd', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', NULL, NULL, false, false, NULL, false, false, true, '2025-07-27 12:27:00.206007', '2025-07-27 12:27:00.206007');
INSERT INTO User_tab VALUES (60, '6098403 ', 'GOC-in-C', 'GOC-in-C', 'command', 'swcomd', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', NULL, NULL, false, false, NULL, false, false, true, '2025-07-27 12:29:30.479104', '2025-07-27 12:29:30.479104');
INSERT INTO User_tab VALUES (55, '6991544 ', 'GOC-in-C', 'GOC-in-C', 'command', 'wcomd', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', NULL, NULL, false, false, NULL, false, false, true, '2025-07-27 12:25:43.298693', '2025-07-27 12:35:02.029186');
INSERT INTO User_tab VALUES (58, '7615185 ', 'COS     ', 'Col A (Comd)', 'command', 'ecomd_member', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', NULL, NULL, false, true, 57, false, false, true, '2025-07-27 12:27:27.146325', '2025-07-27 14:07:50.017999');
INSERT INTO User_tab VALUES (19, '1174267 ', 'CO      ', 'Unit1', 'unit', 'unit1', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', 9, NULL, false, false, NULL, false, false, true, '2025-07-27 12:04:09.368201', '2025-07-27 12:36:28.144734');
INSERT INTO User_tab VALUES (21, '7955613 ', 'CO      ', 'CO', 'unit', 'unit3', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', 11, NULL, false, false, NULL, false, false, true, '2025-07-27 12:06:59.385931', '2025-07-27 13:07:11.224607');
INSERT INTO User_tab VALUES (49, '8317727 ', 'GOC-in-C', 'GOC-in-C', 'command', 'ncomd', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', 20, NULL, false, false, NULL, false, true, true, '2025-07-27 12:22:58.429063', '2025-07-27 14:00:56.718786');
INSERT INTO User_tab VALUES (36, '6011499 ', 'DY CDR  ', 'CY CDR', 'brigade', 'bde3_member', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', NULL, NULL, false, true, 35, false, false, true, '2025-07-27 12:15:22.229005', '2025-07-27 14:07:03.581031');
INSERT INTO User_tab VALUES (38, '9231217 ', 'AAG  ', 'AAG', 'brigade', 'bde4_member', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', NULL, NULL, false, true, 37, false, false, true, '2025-07-27 12:16:11.261116', '2025-07-27 14:07:03.581031');
INSERT INTO User_tab VALUES (40, '7886192 ', 'Col A (Div)  ', 'Col A (Div)', 'division', 'div1_member', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', NULL, NULL, false, true, 39, false, false, true, '2025-07-27 12:17:37.99353', '2025-07-27 14:07:03.581031');
INSERT INTO User_tab VALUES (42, '3520596 ', 'Col A (Div)  ', 'Col A (Div)', 'division', 'div2_member', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', NULL, NULL, false, true, 41, false, false, true, '2025-07-27 12:18:34.76076', '2025-07-27 14:07:03.581031');
INSERT INTO User_tab VALUES (44, '5492184 ', 'Col A (Div)  ', 'Col A (Div)', 'division', 'div3_member', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', NULL, NULL, false, true, 43, false, false, true, '2025-07-27 12:19:22.888115', '2025-07-27 14:07:03.581031');
INSERT INTO User_tab VALUES (46, '1137728 ', 'Col A (Corps)     ', 'Col A (Corps)', 'corps', 'corps1_member', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', NULL, NULL, false, true, 45, false, false, true, '2025-07-27 12:20:56.43864', '2025-07-27 14:07:03.581031');
INSERT INTO User_tab VALUES (48, '5083506 ', 'Col A (Corps)     ', 'Col A (Corps)', 'corps', 'corps2_member', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', NULL, NULL, false, true, 47, false, false, true, '2025-07-27 12:21:51.708068', '2025-07-27 14:07:03.581031');
INSERT INTO User_tab VALUES (50, '2075539 ', 'Col A (Comd)     ', 'Col A (Comd)', 'command', 'ncomd_member', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', NULL, NULL, false, true, 49, false, false, true, '2025-07-27 12:23:30.568416', '2025-07-27 14:07:50.017999');
INSERT INTO User_tab VALUES (52, '5726192 ', 'Col A (Comd)     ', 'Col A (Comd)', 'command', 'scomd_member', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', NULL, NULL, false, true, 51, false, false, true, '2025-07-27 12:24:32.976703', '2025-07-27 14:07:50.017999');
INSERT INTO User_tab VALUES (54, '6301271 ', 'Col A (Comd)     ', 'Col A (Comd)', 'command', 'ccomd_member', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', NULL, NULL, false, true, 53, false, false, true, '2025-07-27 12:25:21.126739', '2025-07-27 14:07:50.017999');
INSERT INTO User_tab VALUES (56, '6174894 ', 'Col A (Comd)     ', 'Col A (Comd)', 'command', 'wcomd_member', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', NULL, NULL, false, true, 55, false, false, true, '2025-07-27 12:26:22.243168', '2025-07-27 14:07:50.017999');
INSERT INTO User_tab VALUES (59, '8486450 ', 'Col A (Comd)     ', 'Col A (Comd)', 'command', 'swcomd_member', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', NULL, NULL, false, true, NULL, false, false, true, '2025-07-27 12:28:14.097025', '2025-07-27 14:07:50.017999');
INSERT INTO User_tab VALUES (61, '2153792 ', 'Lt Col  ', 'CDR', 'brigade', 'testbrigade1', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', NULL, NULL, false, false, NULL, false, false, true, '2025-07-27 14:10:26.342891', '2025-07-27 14:10:26.342891');
INSERT INTO User_tab VALUES (62, '5643272 ', 'Maj     ', 'AAG', 'brigade', 'testbrigade1_member', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', 21, NULL, false, true, NULL, false, false, true, '2025-07-27 14:11:03.210458', '2025-07-27 14:12:40.25409');
INSERT INTO User_tab VALUES (34, '6005154 ', 'DY CDR  ', 'AAG', 'brigade', 'bde2_member', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', 22, NULL, false, true, NULL, false, false, true, '2025-07-27 12:14:33.982775', '2025-07-27 14:13:46.968177');

INSERT INTO public.unit_tab VALUES (1, 'A1234567', 'Unit Alpha', 'ADM-CH-1', 'TECH-CH-1', 'BDE-1', 'DIV-1', 'CORPS-1', 'Northern Command', NULL, NULL, NULL, '[]', '[]', false, false, false, '2025-07-15 20:37:28.455185', '2025-07-15 20:37:28.455185');
INSERT INTO public.unit_tab VALUES (12, NULL, 'unit4', '', '', 'brigade1', 'divison1', 'corps1', 'Northern Command', 'INFANTRY', 'HINTERLAND,LC/AIOS/LAC/HAA/AGPL', 'kashmir', '[{"award_id": "255568df-5bc0-4513-b207-592c3cc88df4", "award_type": "GOC-in-C", "award_year": "2017", "award_title": "citation"}]', '[]', false, false, false, '2025-07-27 13:09:09.984428', '2025-07-27 13:09:09.984428');
INSERT INTO public.unit_tab VALUES (13, NULL, 'unit5', '', '', 'brigade2', 'divison1', 'corps1', 'Northern Command', 'ARMD/MECH INF', 'HINTERLAND', 'kashmir', '[]', '[]', false, false, false, '2025-07-27 13:11:01.542334', '2025-07-27 13:11:01.542334');
INSERT INTO public.unit_tab VALUES (14, NULL, 'unit6', '', '', 'brigade2', 'divison1', 'corps1', 'Northern Command', 'AAD', 'LC/AIOS/LAC/HAA/AGPL', 'kashmir', '[{"award_id": "f6d3a2a2-c61e-49b9-a246-db5be15bb990", "award_type": "GOC-in-C", "award_year": "2016", "award_title": "appreciation"}]', '[]', false, false, false, '2025-07-27 13:12:53.019649', '2025-07-27 13:12:53.019649');
INSERT INTO public.unit_tab VALUES (15, NULL, 'unit7', '', '', 'brigade2', 'divison1', 'corps1', 'Northern Command', 'ARTY', 'LC/AIOS/LAC/HAA/AGPL', 'kashmir', '[]', '[]', false, false, false, '2025-07-27 13:14:37.294499', '2025-07-27 13:14:37.294499');
INSERT INTO public.unit_tab VALUES (4, NULL, 'divison1', '', '', NULL, NULL, 'corps1', 'Northern Command', '', '{""}', '', '[]', '[{"id": "14036953-aecb-4f67-947f-becc47bd3cb9", "name": "frfsgdfgdfg", "rank": "Maj Gen", "ic_number": "3r345", "appointment": "ffgdg", "member_type": "presiding_officer", "member_order": ""}]', false, false, false, '2025-07-17 22:56:00.851661', '2025-07-17 22:56:47.848432');
INSERT INTO public.unit_tab VALUES (5, NULL, 'corps1', '', '', NULL, NULL, NULL, 'Northern Command', '', '{""}', '', '[]', '[{"id": "3aefd88a-cda8-4bb7-9c0a-c84ed7f43f0c", "name": "svs", "rank": "Brig", "ic_number": "2434", "appointment": "wf", "member_type": "presiding_officer", "member_order": ""}]', false, false, false, '2025-07-18 19:47:20.624527', '2025-07-18 19:48:20.563818');
INSERT INTO public.unit_tab VALUES (21, NULL, 'mybde', '', '', NULL, 'divison2', 'corps2', 'Northern Command', '', '', '', '[]', '[]', false, false, false, '2025-07-27 14:12:40.25409', '2025-07-27 14:12:40.25409');
INSERT INTO public.unit_tab VALUES (19, NULL, 'corps1', '', '', NULL, NULL, NULL, 'Northern Command', '', '{""}', '', '[]', '[{"id": "656cd465-d5b9-4261-9eb4-ed11a4d25d81", "name": "AK Tiwary", "rank": "Col", "ic_number": "123334", "appointment": "COS, div1, Northern Command", "member_type": "presiding_officer", "member_order": ""}]', false, false, false, '2025-07-27 13:32:19.262108', '2025-07-27 13:32:58.45372');
INSERT INTO public.unit_tab VALUES (22, NULL, 'brigade2', '', '', NULL, 'divison1', 'corps1', 'Northern Command', '', '{"{\"\"}"}', '', '[]', '[]', false, false, false, '2025-07-27 14:13:46.968177', '2025-07-27 14:13:46.968177');
INSERT INTO public.unit_tab VALUES (6, NULL, 'Northern Command', '', '', NULL, NULL, NULL, NULL, '', '{"{\"\"}"}', '', '[]', '[{"id": "345b3672-352b-4e8c-b869-b4c3e3326708", "name": "fdfgd", "rank": "Maj Gen", "ic_number": "13343", "appointment": "vdf", "member_type": "presiding_officer", "member_order": ""}]', false, false, false, '2025-07-18 19:48:44.204581', '2025-07-18 19:50:05.779366');
INSERT INTO public.unit_tab VALUES (18, NULL, 'divison1', '', '', NULL, NULL, 'corps1', 'Northern Command', '', '{"{\"{}\"}"}', '', '[]', '[{"id": "1eb53ea2-473d-42dc-9a6d-4b3c5d5bfb22", "name": "A D Kumar", "rank": "Col", "ic_number": "132432", "appointment": "DY CDR, div1, Northern Command", "member_type": "presiding_officer", "member_order": ""}, {"id": "89d412f6-ca09-43c1-9892-acc678680c0b", "name": "AK Gupta", "rank": "Lt Col", "ic_number": "13333", "appointment": "2IC, div1, Northern Command", "member_type": "member_officer", "member_order": "1"}]', false, false, false, '2025-07-27 13:28:57.523669', '2025-07-27 13:30:02.415296');
INSERT INTO public.unit_tab VALUES (7, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{}', NULL, '[]', '[{"id": "d60d8932-17d5-4b0b-a753-4225a8b015b2", "name": "sfdsjkf", "rank": "Maj Gen", "ic_number": "1323", "appointment": "jksdbf", "member_type": "presiding_officer", "member_order": ""}]', false, false, false, '2025-07-18 22:03:58.24706', '2025-07-18 22:03:58.24706');
INSERT INTO public.unit_tab VALUES (8, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{"{\"{}\"}"}', NULL, '[]', '[{"id": "93782159-d02d-419e-914f-084af9383f68", "name": "rergsvvfd", "rank": "Maj Gen", "ic_number": "1333", "appointment": "fdfd", "member_type": "presiding_officer", "member_order": ""}]', false, false, false, '2025-07-19 23:07:43.96847', '2025-07-27 13:36:17.235413');
INSERT INTO public.unit_tab VALUES (20, NULL, 'Northern Command', '', '', NULL, NULL, NULL, NULL, '', '{""}', '', '[]', '[{"id": "00f47a24-e8e7-4e64-a38b-d3cdadba8716", "name": "PB Singh", "rank": "Maj Gen", "ic_number": "12333344", "appointment": "COS, Northern Command", "member_type": "presiding_officer", "member_order": ""}]', false, false, false, '2025-07-27 14:00:56.718786', '2025-07-27 14:01:31.558632');
INSERT INTO public.unit_tab VALUES (9, NULL, 'unit1', '', '', 'brigade1', 'divison1', 'corps1', 'Northern Command', 'ARMY AVN', 'HINTERLAND', 'kashmir', '[{"award_id": "62e65335-f06d-41d2-8f88-d3d3d323bca6", "award_type": "GOC-in-C", "award_year": "2014", "award_title": "citation"}]', '[]', false, false, false, '2025-07-27 12:36:28.144734', '2025-07-27 12:36:28.144734');
INSERT INTO public.unit_tab VALUES (3, NULL, 'brigade1', '', '', NULL, 'divison1', 'corps1', 'Northern Command', '', '{""}', '', '[]', '[{"id": "77575b94-ae87-4585-82ea-930acf25df53", "name": "pp", "rank": "Lt Gen", "ic_number": "786876", "appointment": "ndnd", "member_type": "presiding_officer", "member_order": ""}]', false, false, false, '2025-07-15 21:03:36.013711', '2025-07-27 12:42:07.712382');
INSERT INTO public.unit_tab VALUES (2, NULL, 'unit1', '', '', 'mybde', 'divison1', 'corps1', 'Northern Command', 'INFANTRY', 'HINTERLAND', 'kashmir', '[{"award_id": "7cc434dc-0edb-4632-b54c-3d082aa9f3ed", "award_type": "COAS", "award_year": "2009", "award_title": "appreciation"}]', '[]', false, false, false, '2025-07-15 20:48:41.095602', '2025-07-27 12:49:55.815675');
INSERT INTO public.unit_tab VALUES (10, NULL, 'unit2', '', '', 'brigade1', 'divison1', 'corps1', 'Northern Command', 'ARTY', 'LC/AIOS/LAC/HAA/AGPL,HINTERLAND', 'kashmir', '[{"award_id": "a5791033-b5a3-46eb-889a-89784d015c48", "award_type": "GOC-in-C", "award_year": "2013", "award_title": "citation"}, {"award_id": "2bf68512-28a7-485b-9496-c4b0a1c73b83", "award_type": "COAS", "award_year": "2009", "award_title": "appreciation"}]', '[]', false, false, false, '2025-07-27 13:05:17.463645', '2025-07-27 13:05:17.463645');
INSERT INTO public.unit_tab VALUES (11, NULL, 'unit3', '', '', 'brigade1', 'divison1', 'corps1', 'Northern Command', 'ASC (AT)', 'LC/AIOS/LAC/HAA/AGPL', 'kashmir', '[{"award_id": "30d8ee30-8f87-4ba0-ae2e-99dbfe4237bb", "award_type": "GOC-in-C", "award_year": "2020", "award_title": "citation"}]', '[]', false, false, false, '2025-07-27 13:07:11.224607', '2025-07-27 13:07:11.224607');
INSERT INTO public.unit_tab VALUES (16, NULL, 'brigade1', '', '', NULL, 'divison1', 'corps1', 'Northern Command', '', '{"{\"\"}"}', '', '[]', '[{"id": "6f260f85-f1ff-48df-b7d1-10fe205aa6ab", "name": "AB Jha", "rank": "Lt Col", "ic_number": "12334", "appointment": "DY CDR, Bde1, Northern Command", "member_type": "presiding_officer", "member_order": ""}, {"id": "ba69d13f-179a-49b7-8dca-3a941376e2ff", "name": "Rahul", "rank": "Maj", "ic_number": "53543647", "appointment": "2IC, Bde1, Northern Command", "member_type": "member_officer", "member_order": "1"}]', false, false, false, '2025-07-27 13:15:52.415612', '2025-07-27 14:08:06.807461');
INSERT INTO public.unit_tab VALUES (17, NULL, 'brigade2', '', '', NULL, 'divison1', 'corps1', 'Northern Command', '', '{"{\"{\\\"{\\\\\\\"\\\\\\\"}\\\"}\"}"}', '', '[]', '[{"id": "162e0916-a7be-4c1e-a5fa-8f0574d89943", "name": "Shubham Singh", "rank": "Lt Col", "ic_number": "12435454", "appointment": "DY CDR, bde2, Northern Command", "member_type": "presiding_officer", "member_order": ""}, {"id": "954b3925-e9fa-440f-98f7-3e7848e85824", "name": "P K Sharma", "rank": "Maj", "ic_number": "41422", "appointment": "2IC, bde2, Northern Command", "member_type": "member_officer", "member_order": "1"}]', false, false, false, '2025-07-27 13:22:56.674804', '2025-07-27 14:14:35.977853');

INSERT INTO public.config_tab VALUES (1, '2025-12-31', '/mnt/data/documents', '{"2024 - H1","2024 - H2"}', '2024 - H1');






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
