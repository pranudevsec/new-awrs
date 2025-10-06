-- Create Application_Parameter table to store application-specific parameter data
-- This table will reference the normalized Parameter_Master table

-- Connect to army-2 database
\c army-2;

-- ============================================
-- Create Application_Parameter table
-- ============================================

CREATE TABLE IF NOT EXISTS Application_Parameter (
    app_param_id SERIAL PRIMARY KEY,
    
    -- Application references
    application_type VARCHAR(20) NOT NULL CHECK (application_type IN ('citation', 'appreciation')),
    application_id INTEGER NOT NULL, -- References Citation_tab or Appre_tab
    
    -- Parameter reference
    parameter_id INTEGER NOT NULL REFERENCES Parameter_Master(param_id),
    
    -- Application-specific parameter data
    parameter_name VARCHAR(255) NOT NULL,
    parameter_value DECIMAL(10,2) DEFAULT 0,
    parameter_count INTEGER DEFAULT 0,
    parameter_marks DECIMAL(10,2) DEFAULT 0,
    parameter_upload TEXT, -- File path for uploaded documents
    parameter_negative BOOLEAN DEFAULT FALSE,
    
    -- Approval and review fields
    is_approved BOOLEAN DEFAULT FALSE,
    approved_by_user_id INTEGER,
    approved_by_role VARCHAR(50),
    approved_at TIMESTAMP,
    approved_marks DECIMAL(10,2),
    approved_count INTEGER,
    
    -- Review comments
    reviewer_comment TEXT,
    unit_comment TEXT,
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'clarification_required')),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Constraints
    CONSTRAINT app_param_application_check CHECK (
        (application_type = 'citation' AND application_id IN (SELECT citation_id FROM Citation_tab)) OR
        (application_type = 'appreciation' AND application_id IN (SELECT appreciation_id FROM Appre_tab))
    )
);

-- ============================================
-- Create indexes for performance
-- ============================================

CREATE INDEX idx_app_param_application ON Application_Parameter(application_type, application_id);
CREATE INDEX idx_app_param_parameter ON Application_Parameter(parameter_id);
CREATE INDEX idx_app_param_status ON Application_Parameter(status);
CREATE INDEX idx_app_param_approved ON Application_Parameter(is_approved);

-- ============================================
-- Create triggers for updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_application_parameter_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_application_parameter_timestamp
BEFORE UPDATE ON Application_Parameter
FOR EACH ROW
EXECUTE FUNCTION update_application_parameter_timestamp();

-- ============================================
-- Create views for easy querying
-- ============================================

-- View to get application parameters with parameter master details
CREATE OR REPLACE VIEW Application_Parameter_View AS
SELECT 
    ap.app_param_id,
    ap.application_type,
    ap.application_id,
    ap.parameter_id,
    ap.parameter_name,
    ap.parameter_value,
    ap.parameter_count,
    ap.parameter_marks,
    ap.parameter_upload,
    ap.parameter_negative,
    ap.is_approved,
    ap.approved_by_user_id,
    ap.approved_by_role,
    ap.approved_at,
    ap.approved_marks,
    ap.approved_count,
    ap.reviewer_comment,
    ap.unit_comment,
    ap.status,
    ap.created_at,
    ap.updated_at,
    ap.metadata,
    
    -- Parameter Master details
    pm.category,
    pm.subcategory,
    pm.subsubcategory,
    pm.description,
    pm.max_marks,
    pm.per_unit_mark,
    pm.weightage,
    pm.param_sequence,
    pm.param_mark,
    pm.proof_reqd,
    
    -- Command details
    cm.command_name,
    
    -- Arms service details
    asm.arms_service_name,
    
    -- Deployment details
    dm.deployment_name
FROM Application_Parameter ap
LEFT JOIN Parameter_Master pm ON ap.parameter_id = pm.param_id
LEFT JOIN Command_Master cm ON pm.command_id = cm.command_id
LEFT JOIN Arms_Service_Master asm ON pm.arms_service_id = asm.arms_service_id
LEFT JOIN Deployment_Master dm ON pm.deployment_id = dm.deployment_id;

-- ============================================
-- Create helper functions
-- ============================================

-- Function to get application parameters by application
CREATE OR REPLACE FUNCTION get_application_parameters(
    app_type VARCHAR,
    app_id INTEGER
)
RETURNS TABLE (
    app_param_id INTEGER,
    parameter_name VARCHAR,
    parameter_value DECIMAL,
    parameter_count INTEGER,
    parameter_marks DECIMAL,
    parameter_upload TEXT,
    is_approved BOOLEAN,
    approved_marks DECIMAL,
    status VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ap.app_param_id,
        ap.parameter_name,
        ap.parameter_value,
        ap.parameter_count,
        ap.parameter_marks,
        ap.parameter_upload,
        ap.is_approved,
        ap.approved_marks,
        ap.status
    FROM Application_Parameter ap
    WHERE ap.application_type = app_type 
    AND ap.application_id = app_id
    ORDER BY ap.app_param_id;
END;
$$ LANGUAGE plpgsql;

-- Function to approve application parameter
CREATE OR REPLACE FUNCTION approve_application_parameter(
    param_id INTEGER,
    approved_by_user_id INTEGER,
    approved_by_role VARCHAR,
    approved_marks DECIMAL,
    approved_count INTEGER
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE Application_Parameter 
    SET 
        is_approved = TRUE,
        approved_by_user_id = approve_application_parameter.approved_by_user_id,
        approved_by_role = approve_application_parameter.approved_by_role,
        approved_at = NOW(),
        approved_marks = approve_application_parameter.approved_marks,
        approved_count = approve_application_parameter.approved_count,
        status = 'approved',
        updated_at = NOW()
    WHERE app_param_id = param_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Insert sample data
-- ============================================

-- Insert sample application parameters
INSERT INTO Application_Parameter (
    application_type,
    application_id,
    parameter_id,
    parameter_name,
    parameter_value,
    parameter_count,
    parameter_marks,
    parameter_upload,
    parameter_negative,
    status
) VALUES 
('citation', 1, 1, 'Enemy Kills', 5.0, 5, 20.0, '/uploads/enemy_kills_1.pdf', FALSE, 'pending'),
('citation', 1, 2, 'Rescue Operations', 2.0, 2, 8.0, '/uploads/rescue_ops_1.pdf', FALSE, 'pending'),
('appreciation', 1, 12, 'Medical Camps', 3.0, 3, 6.0, '/uploads/medical_camps_1.pdf', FALSE, 'pending');

-- ============================================
-- Verification queries
-- ============================================

-- Check table creation
SELECT 'Application_Parameter table created successfully!' as status;

-- Check sample data
SELECT 
    'Sample Application Parameters' as check_type,
    COUNT(*) as total_records,
    COUNT(CASE WHEN is_approved = TRUE THEN 1 END) as approved_count,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count
FROM Application_Parameter;

-- Show sample data with parameter master details
SELECT 
    ap.application_type,
    ap.application_id,
    ap.parameter_name,
    ap.parameter_count,
    ap.parameter_marks,
    pm.category,
    pm.subcategory,
    cm.command_name,
    asm.arms_service_name
FROM Application_Parameter ap
LEFT JOIN Parameter_Master pm ON ap.parameter_id = pm.param_id
LEFT JOIN Command_Master cm ON pm.command_id = cm.command_id
LEFT JOIN Arms_Service_Master asm ON pm.arms_service_id = asm.arms_service_id
ORDER BY ap.app_param_id
LIMIT 5;
