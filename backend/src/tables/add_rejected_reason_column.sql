-- Add rejected_reason column to Citation_tab and Appre_tab tables
-- This migration adds the missing rejected_reason column that is referenced in the application code

-- Add rejected_reason column to Citation_tab
ALTER TABLE Citation_tab 
ADD COLUMN rejected_reason TEXT;

-- Add rejected_reason column to Appre_tab  
ALTER TABLE Appre_tab 
ADD COLUMN rejected_reason TEXT;

-- Add comments to document the purpose of these columns
COMMENT ON COLUMN Citation_tab.rejected_reason IS 'Reason for rejection when status_flag is rejected';
COMMENT ON COLUMN Appre_tab.rejected_reason IS 'Reason for rejection when status_flag is rejected';
