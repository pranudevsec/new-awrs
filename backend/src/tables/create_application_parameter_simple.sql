-- Create Application_Parameter table (Simplified version)
-- This table stores application-specific parameter data

\c army-2;

-- ============================================
-- Create Application_Parameter table
-- ============================================

CREATE TABLE Application_Parameter (
    app_param_id SERIAL PRIMARY KEY,
    
    -- Application references
    application_type VARCHAR(20) NOT NULL CHECK (application_type IN ('citation', 'appreciation')),
    application_id INTEGER NOT NULL,
    
    -- Parameter reference
    parameter_id INTEGER NOT NULL REFERENCES Parameter_Master(param_id),
    
    -- Application-specific parameter data
    parameter_name VARCHAR(255) NOT NULL,
    parameter_value DECIMAL(10,2) DEFAULT 0,
    parameter_count INTEGER DEFAULT 0,
    parameter_marks DECIMAL(10,2) DEFAULT 0,
    parameter_upload TEXT,
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
    metadata JSONB DEFAULT '{}'
);

-- ============================================
-- Create indexes
-- ============================================

CREATE INDEX idx_app_param_application ON Application_Parameter(application_type, application_id);
CREATE INDEX idx_app_param_parameter ON Application_Parameter(parameter_id);
CREATE INDEX idx_app_param_status ON Application_Parameter(status);
CREATE INDEX idx_app_param_approved ON Application_Parameter(is_approved);

-- ============================================
-- Create trigger for updated_at
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
-- Create view for easy querying
-- ============================================

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
-- Insert sample data
-- ============================================

-- Get some parameter IDs from Parameter_Master for sample data
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
) 
SELECT 
    'citation' as application_type,
    1 as application_id,
    param_id,
    name,
    5.0 as parameter_value,
    5 as parameter_count,
    20.0 as parameter_marks,
    '/uploads/sample_' || param_id || '.pdf' as parameter_upload,
    FALSE as parameter_negative,
    'pending' as status
FROM Parameter_Master 
WHERE param_id IN (1, 2, 3, 4, 5)
LIMIT 5;

-- ============================================
-- Verification
-- ============================================

SELECT 'Application_Parameter table created successfully!' as status;

-- Check table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'application_parameter' 
ORDER BY ordinal_position;

-- Check sample data
SELECT 
    'Application Parameters' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN is_approved = TRUE THEN 1 END) as approved_count,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count
FROM Application_Parameter;

-- Show sample data with parameter details
SELECT 
    ap.app_param_id,
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
