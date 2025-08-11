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

	INSERT INTO public.user_tab VALUES (6, '34567812', 'some    ', 'Admin', 'admin', 'admin', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', NULL, NULL, false, false, NULL, false, false, true, '2025-07-15 20:37:28.179856', '2025-07-15 20:37:28.179856');
INSERT INTO public.user_tab VALUES (7, '34567813', 'some    ', 'Headquarter', 'headquarter', 'testheadquarter', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', NULL, NULL, false, false, NULL, false, false, true, '2025-07-15 20:37:28.179856', '2025-07-15 20:37:28.179856');
INSERT INTO public.user_tab VALUES (8, '99999999', 'some    ', 'Spl Unit CO', 'unit', 'testspecialunit', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', NULL, NULL, true, false, NULL, false, false, true, '2025-07-15 20:37:28.179856', '2025-07-15 20:37:28.179856');
INSERT INTO public.user_tab VALUES (9, '87654321', 'some    ', 'AAG', 'brigade', 'testbrigade_member', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', NULL, NULL, false, true, 2, false, false, true, '2025-07-15 20:37:28.191118', '2025-07-15 20:37:28.191118');
INSERT INTO public.user_tab VALUES (10, '56781234', 'some    ', 'Col A (Div)', 'division', 'testdivision_member', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', NULL, NULL, false, true, 3, false, false, true, '2025-07-15 20:37:28.191118', '2025-07-15 20:37:28.191118');
INSERT INTO public.user_tab VALUES (11, '43218765', 'some    ', 'Col A (Corps)', 'corps', 'testcorps_member', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', NULL, NULL, false, true, 4, false, false, true, '2025-07-15 20:37:28.191118', '2025-07-15 20:37:28.191118');
INSERT INTO public.user_tab VALUES (12, '34567812', 'some    ', 'Col A (Comd)', 'command', 'testcommand_member', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', NULL, NULL, false, true, 5, false, false, true, '2025-07-15 20:37:28.191118', '2025-07-15 20:37:28.191118');
INSERT INTO public.user_tab VALUES (15, '33333333', 'some    ', 'CW2 HR User', 'cw2', 'testcw2_hr', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', NULL, 'hr', false, false, NULL, false, false, true, '2025-07-15 20:37:28.194814', '2025-07-15 20:37:28.194814');
INSERT INTO public.user_tab VALUES (16, '44444444', 'some    ', 'CW2 DV User', 'cw2', 'testcw2_dv', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', NULL, 'dv', false, false, NULL, false, false, true, '2025-07-15 20:37:28.194814', '2025-07-15 20:37:28.194814');
INSERT INTO public.user_tab VALUES (17, '55555555', 'some    ', 'CW2 MP User', 'cw2', 'testcw2_mp', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', NULL, 'mp', false, false, NULL, false, false, true, '2025-07-15 20:37:28.194814', '2025-07-15 20:37:28.194814');
INSERT INTO public.user_tab VALUES (18, '12345678', 'some    ', 'Reviewer Alpha', 'bridge', 'testuser2', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', NULL, NULL, false, false, NULL, false, false, true, '2025-07-15 20:37:28.469522', '2025-07-15 20:37:28.469522');
INSERT INTO public.user_tab VALUES (1, '12345678', 'some    ', 'CO', 'unit', 'testunit1', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', 2, NULL, false, false, NULL, false, false, true, '2025-07-15 20:37:28.179856', '2025-07-15 20:48:41.095602');
INSERT INTO public.user_tab VALUES (2, '87654321', 'some    ', 'CDR', 'brigade', 'testbrigade', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', 3, NULL, false, false, NULL, true, true, true, '2025-07-15 20:37:28.179856', '2025-07-15 21:03:36.013711');
INSERT INTO public.user_tab VALUES (3, '56781234', 'some    ', 'DIV GOC', 'division', 'testdivision', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', 4, NULL, false, false, NULL, true, true, true, '2025-07-15 20:37:28.179856', '2025-07-17 22:56:00.851661');
INSERT INTO public.user_tab VALUES (4, '43218765', 'some    ', 'CORPS CDR', 'corps', 'testcorps', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', 5, NULL, false, false, NULL, true, true, true, '2025-07-15 20:37:28.179856', '2025-07-18 19:47:20.624527');
INSERT INTO public.user_tab VALUES (5, '34567812', 'some    ', 'GOC-in-C', 'command', 'testcommand', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', 6, NULL, false, false, NULL, true, true, true, '2025-07-15 20:37:28.179856', '2025-07-18 19:48:44.204581');
INSERT INTO public.user_tab VALUES (13, '11111111', 'some    ', 'CW2 MO User', 'cw2', 'testcw2_mo', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', 7, 'mo', false, false, NULL, false, false, true, '2025-07-15 20:37:28.194814', '2025-07-18 22:03:58.24706');
INSERT INTO public.user_tab VALUES (14, '22222222', 'some    ', 'CW2 OL User', 'cw2', 'testcw2_ol', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', 8, 'ol', false, false, NULL, false, false, true, '2025-07-15 20:37:28.194814', '2025-07-19 23:07:43.96847');
INSERT INTO public.user_tab VALUES (26, '7536223 ', 'CO      ', 'CO', 'unit', 'unit8', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', NULL, NULL, false, false, NULL, false, false, true, '2025-07-27 12:09:07.582193', '2025-07-27 12:09:07.582193');
INSERT INTO public.user_tab VALUES (27, '9579556 ', 'CO      ', 'Co', 'unit', 'unit9', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', NULL, NULL, false, false, NULL, false, false, true, '2025-07-27 12:09:34.88363', '2025-07-27 12:09:34.88363');
INSERT INTO public.user_tab VALUES (28, '3928797 ', 'CO      ', 'CO', 'unit', 'unit10', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', NULL, NULL, false, false, NULL, false, false, true, '2025-07-27 12:10:05.604611', '2025-07-27 12:10:05.604611');
INSERT INTO public.user_tab VALUES (29, '1158764 ', 'CO      ', 'CO', 'unit', 'unit11', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', NULL, NULL, false, false, NULL, false, false, true, '2025-07-27 12:10:34.857066', '2025-07-27 12:10:34.857066');
INSERT INTO public.user_tab VALUES (30, '2364946 ', 'CO      ', 'CO', 'unit', 'unit12', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', NULL, NULL, false, false, NULL, false, false, true, '2025-07-27 12:10:58.234665', '2025-07-27 12:10:58.234665');
INSERT INTO public.user_tab VALUES (35, '8797829 ', 'CDR     ', 'CDR', 'brigade', 'bde3', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', NULL, NULL, false, false, NULL, false, false, true, '2025-07-27 12:14:54.645154', '2025-07-27 12:14:54.645154');
INSERT INTO public.user_tab VALUES (37, '3426194 ', 'CDR     ', 'CDR', 'brigade', 'bde4', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', NULL, NULL, false, false, NULL, false, false, true, '2025-07-27 12:15:43.359666', '2025-07-27 12:15:43.359666');
INSERT INTO public.user_tab VALUES (41, '1846547 ', 'DIV GOC ', 'DIV GOC', 'division', 'div2', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', NULL, NULL, false, false, NULL, false, false, true, '2025-07-27 12:18:02.924686', '2025-07-27 12:18:02.924686');
INSERT INTO public.user_tab VALUES (43, '7434002 ', 'DIV GOC ', 'DIV GOC', 'division', 'div3', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', NULL, NULL, false, false, NULL, false, false, true, '2025-07-27 12:19:00.298344', '2025-07-27 12:19:00.298344');
INSERT INTO public.user_tab VALUES (47, '1790449 ', 'CORPS C ', 'CORPS CDR', 'corps', 'corps2', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', NULL, NULL, false, false, NULL, false, false, true, '2025-07-27 12:21:26.434073', '2025-07-27 12:21:26.434073');
INSERT INTO public.user_tab VALUES (20, '2400826 ', 'CO      ', 'CO', 'unit', 'unit2', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', 10, NULL, false, false, NULL, false, false, true, '2025-07-27 12:06:32.466313', '2025-07-27 13:05:17.463645');
INSERT INTO public.user_tab VALUES (22, '4994927 ', 'CO      ', 'CO', 'unit', 'unit4', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', 12, NULL, false, false, NULL, false, false, true, '2025-07-27 12:07:20.732191', '2025-07-27 13:09:09.984428');
INSERT INTO public.user_tab VALUES (23, '1923615 ', 'CO      ', 'CO', 'unit', 'unit5', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', 13, NULL, false, false, NULL, false, false, true, '2025-07-27 12:07:48.326667', '2025-07-27 13:11:01.542334');
INSERT INTO public.user_tab VALUES (24, '1052614 ', 'CO      ', 'CO', 'unit', 'unit6', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', 14, NULL, false, false, NULL, false, false, true, '2025-07-27 12:08:11.156901', '2025-07-27 13:12:53.019649');
INSERT INTO public.user_tab VALUES (25, '7109625 ', 'CO      ', 'CO', 'unit', 'unit7', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', 15, NULL, false, false, NULL, false, false, true, '2025-07-27 12:08:37.337739', '2025-07-27 13:14:37.294499');
INSERT INTO public.user_tab VALUES (31, '5628146 ', 'CDR     ', 'CDR', 'brigade', 'bde1', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', 16, NULL, false, false, NULL, false, false, true, '2025-07-27 12:11:59.989562', '2025-07-27 13:15:52.415612');
INSERT INTO public.user_tab VALUES (33, '9890959 ', 'CDR     ', 'CDR', 'brigade', 'bde2', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', 17, NULL, false, false, NULL, false, false, true, '2025-07-27 12:14:03.882564', '2025-07-27 13:22:56.674804');
INSERT INTO public.user_tab VALUES (39, '1428481 ', 'DIV GOS ', 'DIV GOC', 'division', 'div1', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', 18, NULL, false, false, NULL, false, false, true, '2025-07-27 12:17:08.36756', '2025-07-27 13:28:57.523669');
INSERT INTO public.user_tab VALUES (45, '2724902 ', 'CORPS C ', 'CORPS CDR', 'corps', 'corps1', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', 19, NULL, false, false, NULL, false, false, true, '2025-07-27 12:20:28.494464', '2025-07-27 13:32:19.262108');
INSERT INTO public.user_tab VALUES (32, '5273174 ', 'AAG  ', 'AAG', 'brigade', 'bde1_member', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', NULL, NULL, false, true, 31, false, false, true, '2025-07-27 12:13:42.930595', '2025-07-27 14:07:03.581031');
INSERT INTO public.user_tab VALUES (51, '8557716 ', 'GOC-in-C', 'GOC-in-C', 'command', 'scomd', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', NULL, NULL, false, false, NULL, false, false, true, '2025-07-27 12:24:01.547788', '2025-07-27 12:24:01.547788');
INSERT INTO public.user_tab VALUES (53, '9010503 ', 'GOC-in-C', 'GOC-in-C', 'command', 'ccomd', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', NULL, NULL, false, false, NULL, false, false, true, '2025-07-27 12:24:57.718066', '2025-07-27 12:24:57.718066');
INSERT INTO public.user_tab VALUES (57, '2051974 ', 'GOC-in-C', 'GOC-in-C', 'command', 'ecomd', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', NULL, NULL, false, false, NULL, false, false, true, '2025-07-27 12:27:00.206007', '2025-07-27 12:27:00.206007');
INSERT INTO public.user_tab VALUES (60, '6098403 ', 'GOC-in-C', 'GOC-in-C', 'command', 'swcomd', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', NULL, NULL, false, false, NULL, false, false, true, '2025-07-27 12:29:30.479104', '2025-07-27 12:29:30.479104');
INSERT INTO public.user_tab VALUES (55, '6991544 ', 'GOC-in-C', 'GOC-in-C', 'command', 'wcomd', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', NULL, NULL, false, false, NULL, false, false, true, '2025-07-27 12:25:43.298693', '2025-07-27 12:35:02.029186');
INSERT INTO public.user_tab VALUES (58, '7615185 ', 'COS     ', 'Col A (Comd)', 'command', 'ecomd_member', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', NULL, NULL, false, true, 57, false, false, true, '2025-07-27 12:27:27.146325', '2025-07-27 14:07:50.017999');
INSERT INTO public.user_tab VALUES (19, '1174267 ', 'CO      ', 'Unit1', 'unit', 'unit1', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', 9, NULL, false, false, NULL, false, false, true, '2025-07-27 12:04:09.368201', '2025-07-27 12:36:28.144734');
INSERT INTO public.user_tab VALUES (21, '7955613 ', 'CO      ', 'CO', 'unit', 'unit3', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', 11, NULL, false, false, NULL, false, false, true, '2025-07-27 12:06:59.385931', '2025-07-27 13:07:11.224607');
INSERT INTO public.user_tab VALUES (49, '8317727 ', 'GOC-in-C', 'GOC-in-C', 'command', 'ncomd', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', 20, NULL, false, false, NULL, false, false, true, '2025-07-27 12:22:58.429063', '2025-07-27 14:00:56.718786');
INSERT INTO public.user_tab VALUES (36, '6011499 ', 'DY CDR  ', 'CY CDR', 'brigade', 'bde3_member', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', NULL, NULL, false, true, 35, false, false, true, '2025-07-27 12:15:22.229005', '2025-07-27 14:07:03.581031');
INSERT INTO public.user_tab VALUES (38, '9231217 ', 'AAG  ', 'AAG', 'brigade', 'bde4_member', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', NULL, NULL, false, true, 37, false, false, true, '2025-07-27 12:16:11.261116', '2025-07-27 14:07:03.581031');
INSERT INTO public.user_tab VALUES (40, '7886192 ', 'Col A (Div)  ', 'Col A (Div)', 'division', 'div1_member', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', NULL, NULL, false, true, 39, false, false, true, '2025-07-27 12:17:37.99353', '2025-07-27 14:07:03.581031');
INSERT INTO public.user_tab VALUES (42, '3520596 ', 'Col A (Div)  ', 'Col A (Div)', 'division', 'div2_member', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', NULL, NULL, false, true, 41, false, false, true, '2025-07-27 12:18:34.76076', '2025-07-27 14:07:03.581031');
INSERT INTO public.user_tab VALUES (44, '5492184 ', 'Col A (Div)  ', 'Col A (Div)', 'division', 'div3_member', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', NULL, NULL, false, true, 43, false, false, true, '2025-07-27 12:19:22.888115', '2025-07-27 14:07:03.581031');
INSERT INTO public.user_tab VALUES (46, '1137728 ', 'Col A (Corps)     ', 'Col A (Corps)', 'corps', 'corps1_member', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', NULL, NULL, false, true, 45, false, false, true, '2025-07-27 12:20:56.43864', '2025-07-27 14:07:03.581031');
INSERT INTO public.user_tab VALUES (48, '5083506 ', 'Col A (Corps)     ', 'Col A (Corps)', 'corps', 'corps2_member', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', NULL, NULL, false, true, 47, false, false, true, '2025-07-27 12:21:51.708068', '2025-07-27 14:07:03.581031');
INSERT INTO public.user_tab VALUES (50, '2075539 ', 'Col A (Comd)     ', 'Col A (Comd)', 'command', 'ncomd_member', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', NULL, NULL, false, true, 49, false, false, true, '2025-07-27 12:23:30.568416', '2025-07-27 14:07:50.017999');
INSERT INTO public.user_tab VALUES (52, '5726192 ', 'Col A (Comd)     ', 'Col A (Comd)', 'command', 'scomd_member', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', NULL, NULL, false, true, 51, false, false, true, '2025-07-27 12:24:32.976703', '2025-07-27 14:07:50.017999');
INSERT INTO public.user_tab VALUES (54, '6301271 ', 'Col A (Comd)     ', 'Col A (Comd)', 'command', 'ccomd_member', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', NULL, NULL, false, true, 53, false, false, true, '2025-07-27 12:25:21.126739', '2025-07-27 14:07:50.017999');
INSERT INTO public.user_tab VALUES (56, '6174894 ', 'Col A (Comd)     ', 'Col A (Comd)', 'command', 'wcomd_member', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', NULL, NULL, false, true, 55, false, false, true, '2025-07-27 12:26:22.243168', '2025-07-27 14:07:50.017999');
INSERT INTO public.user_tab VALUES (59, '8486450 ', 'Col A (Comd)     ', 'Col A (Comd)', 'command', 'swcomd_member', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', NULL, NULL, false, true, NULL, false, false, true, '2025-07-27 12:28:14.097025', '2025-07-27 14:07:50.017999');
INSERT INTO public.user_tab VALUES (61, '2153792 ', 'Lt Col  ', 'CDR', 'brigade', 'testbrigade1', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', NULL, NULL, false, false, NULL, false, false, true, '2025-07-27 14:10:26.342891', '2025-07-27 14:10:26.342891');
INSERT INTO public.user_tab VALUES (62, '5643272 ', 'Maj     ', 'AAG', 'brigade', 'testbrigade1_member', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', 21, NULL, false, true, NULL, false, false, true, '2025-07-27 14:11:03.210458', '2025-07-27 14:12:40.25409');
INSERT INTO public.user_tab VALUES (34, '6005154 ', 'DY CDR  ', 'AAG', 'brigade', 'bde2_member', '$2b$10$FCHwKvPqS2IrJY2OZtJ2OemtfeFiz1Cj/ez8bv6NwTk5.Se.YaFwq', 22, NULL, false, true, NULL, false, false, true, '2025-07-27 12:14:33.982775', '2025-07-27 14:13:46.968177');

