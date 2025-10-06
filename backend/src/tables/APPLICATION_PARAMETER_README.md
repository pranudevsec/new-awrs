# Application_Parameter Table Documentation

## Overview
The `Application_Parameter` table stores application-specific parameter data for both citation and appreciation applications. It references the normalized `Parameter_Master` table and maintains proper foreign key relationships.

## Table Structure

### Primary Table: Application_Parameter

| Column | Type | Description |
|--------|------|-------------|
| `app_param_id` | SERIAL PRIMARY KEY | Unique identifier for application parameter |
| `application_type` | VARCHAR(20) | Type of application ('citation' or 'appreciation') |
| `application_id` | INTEGER | ID of the citation or appreciation application |
| `parameter_id` | INTEGER | Foreign key to Parameter_Master(param_id) |
| `parameter_name` | VARCHAR(255) | Name of the parameter |
| `parameter_value` | DECIMAL(10,2) | Numeric value of the parameter |
| `parameter_count` | INTEGER | Count/quantity of the parameter |
| `parameter_marks` | DECIMAL(10,2) | Marks awarded for this parameter |
| `parameter_upload` | TEXT | File path for uploaded documents |
| `parameter_negative` | BOOLEAN | Whether this is a negative parameter |
| `is_approved` | BOOLEAN | Whether this parameter is approved |
| `approved_by_user_id` | INTEGER | User ID who approved this parameter |
| `approved_by_role` | VARCHAR(50) | Role of the approver |
| `approved_at` | TIMESTAMP | When this parameter was approved |
| `approved_marks` | DECIMAL(10,2) | Marks approved for this parameter |
| `approved_count` | INTEGER | Count approved for this parameter |
| `reviewer_comment` | TEXT | Comment from reviewer |
| `unit_comment` | TEXT | Comment from unit |
| `status` | VARCHAR(20) | Status ('pending', 'approved', 'rejected', 'clarification_required') |
| `created_at` | TIMESTAMP | When record was created |
| `updated_at` | TIMESTAMP | When record was last updated |
| `metadata` | JSONB | Additional metadata |

## Relationships

### Foreign Key References
- `parameter_id` → `Parameter_Master(param_id)`
- `Parameter_Master` → `Command_Master(command_id)`
- `Parameter_Master` → `Arms_Service_Master(arms_service_id)`
- `Parameter_Master` → `Deployment_Master(deployment_id)`

### Application References
- For `application_type = 'citation'`: `application_id` references `Citation_tab(citation_id)`
- For `application_type = 'appreciation'`: `application_id` references `Appre_tab(appreciation_id)`

## Views

### Application_Parameter_View
A comprehensive view that joins Application_Parameter with all related tables:

```sql
SELECT * FROM Application_Parameter_View;
```

This view includes:
- All Application_Parameter fields
- Parameter Master details (category, subcategory, description, etc.)
- Command details (command_name)
- Arms service details (arms_service_name)
- Deployment details (deployment_name)

## Usage Examples

### 1. Insert Application Parameter
```sql
INSERT INTO Application_Parameter (
    application_type,
    application_id,
    parameter_id,
    parameter_name,
    parameter_value,
    parameter_count,
    parameter_marks,
    parameter_upload,
    status
) VALUES (
    'citation',
    1,
    17406,
    'Enemy Kills',
    5.0,
    5,
    20.0,
    '/uploads/enemy_kills_1.pdf',
    'pending'
);
```

### 2. Get Application Parameters
```sql
-- Get all parameters for a specific application
SELECT * FROM Application_Parameter_View 
WHERE application_type = 'citation' 
AND application_id = 1;
```

### 3. Approve Application Parameter
```sql
UPDATE Application_Parameter 
SET 
    is_approved = TRUE,
    approved_by_user_id = 123,
    approved_by_role = 'brigade',
    approved_at = NOW(),
    approved_marks = 18.0,
    approved_count = 4,
    status = 'approved'
WHERE app_param_id = 4;
```

### 4. Get Parameters by Status
```sql
-- Get all pending parameters
SELECT * FROM Application_Parameter_View 
WHERE status = 'pending';

-- Get all approved parameters
SELECT * FROM Application_Parameter_View 
WHERE is_approved = TRUE;
```

### 5. Get Parameters by Application Type
```sql
-- Get all citation parameters
SELECT * FROM Application_Parameter_View 
WHERE application_type = 'citation';

-- Get all appreciation parameters
SELECT * FROM Application_Parameter_View 
WHERE application_type = 'appreciation';
```

## Indexes

The table has the following indexes for performance:
- `idx_app_param_application` on (application_type, application_id)
- `idx_app_param_parameter` on (parameter_id)
- `idx_app_param_status` on (status)
- `idx_app_param_approved` on (is_approved)

## Triggers

### Updated At Trigger
Automatically updates the `updated_at` timestamp when a record is modified.

## Data Flow

### 1. Application Creation
1. User creates a citation or appreciation application
2. Application parameters are inserted into `Application_Parameter` table
3. Each parameter references a `Parameter_Master` record
4. Status is set to 'pending'

### 2. Review Process
1. Reviewer views application parameters
2. Reviewer can approve/reject individual parameters
3. Approved parameters get `is_approved = TRUE` and approval details
4. Status changes to 'approved' or 'rejected'

### 3. Final Approval
1. All parameters must be approved for final application approval
2. Application status changes based on parameter approvals

## Benefits

### ✅ Normalized Structure
- References Parameter_Master for consistent parameter definitions
- No duplicate parameter data
- Single source of truth for parameter information

### ✅ Flexible Application System
- Supports both citation and appreciation applications
- Individual parameter approval workflow
- Detailed tracking of approvals and comments

### ✅ Data Integrity
- Foreign key constraints ensure valid references
- Check constraints ensure valid status values
- Automatic timestamp updates

### ✅ Performance
- Proper indexing for fast queries
- Optimized joins through views
- Efficient parameter lookups

## Sample Data

The table currently contains sample data:
- 3 application parameters
- 2 citation parameters (Enemy Kills, Rescue Operations)
- 1 appreciation parameter (Medical Camps)
- All parameters are in 'pending' status
- All parameters reference valid Parameter_Master records

## Next Steps

1. **Backend Integration**: Update backend services to use Application_Parameter table
2. **Frontend Integration**: Update frontend to display and manage application parameters
3. **Workflow Implementation**: Implement parameter approval workflow
4. **Reporting**: Create reports based on application parameters
5. **Analytics**: Add analytics for parameter usage and approval rates

## Database Schema

```sql
-- Application_Parameter table structure
CREATE TABLE Application_Parameter (
    app_param_id SERIAL PRIMARY KEY,
    application_type VARCHAR(20) NOT NULL CHECK (application_type IN ('citation', 'appreciation')),
    application_id INTEGER NOT NULL,
    parameter_id INTEGER NOT NULL REFERENCES Parameter_Master(param_id),
    parameter_name VARCHAR(255) NOT NULL,
    parameter_value DECIMAL(10,2) DEFAULT 0,
    parameter_count INTEGER DEFAULT 0,
    parameter_marks DECIMAL(10,2) DEFAULT 0,
    parameter_upload TEXT,
    parameter_negative BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT FALSE,
    approved_by_user_id INTEGER,
    approved_by_role VARCHAR(50),
    approved_at TIMESTAMP,
    approved_marks DECIMAL(10,2),
    approved_count INTEGER,
    reviewer_comment TEXT,
    unit_comment TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'clarification_required')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);
```

This table provides a robust foundation for managing application parameters with proper normalization and foreign key relationships.
