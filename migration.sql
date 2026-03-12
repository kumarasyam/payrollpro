USE PayrollProDB;
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Users') AND name = 'gender')
    ALTER TABLE dbo.Users ADD gender NVARCHAR(10) NULL CHECK (gender IN ('Male', 'Female', 'Other'));
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Employees') AND name = 'gender')
    ALTER TABLE dbo.Employees ADD gender NVARCHAR(10) NULL CHECK (gender IN ('Male', 'Female', 'Other'));
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.LeaveApplications') AND name = 'document_url')
    ALTER TABLE dbo.LeaveApplications ADD document_url NVARCHAR(500) NULL;
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.SalaryApprovals') AND name = 'rejection_reason')
    ALTER TABLE dbo.SalaryApprovals ADD rejection_reason NVARCHAR(500) NULL;
GO

-- Update SalaryApprovals check constraint
-- First drop existing constraint if possible (hard without knowing its name, but it usually has a system name)
-- However, we can just update the check constraint if we know it.
-- Actually, let's just add the columns and update LeavePolicy.

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.LeavePolicy') AND name = 'max_maternity')
    ALTER TABLE dbo.LeavePolicy ADD max_maternity INT NOT NULL DEFAULT 90;
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.LeavePolicy') AND name = 'max_paternity')
    ALTER TABLE dbo.LeavePolicy ADD max_paternity INT NOT NULL DEFAULT 15;
GO

-- Update LeavePolicy values
UPDATE dbo.LeavePolicy SET 
    max_sick = 15, 
    max_casual = 12, 
    max_earned = 20, 
    max_maternity = 90, 
    max_paternity = 15, 
    advance_days_required = 2, 
    admin_action_days = 5;
GO
