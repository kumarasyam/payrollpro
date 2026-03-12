USE PayrollProDB;
GO

-- ── Add gender to Users ──────────────────────────────────────────────────────
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Users') AND name = 'gender')
    ALTER TABLE dbo.Users ADD gender NVARCHAR(10) NULL CHECK (gender IN ('Male', 'Female', 'Other'));
GO

-- ── Add gender to Employees ───────────────────────────────────────────────────
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Employees') AND name = 'gender')
    ALTER TABLE dbo.Employees ADD gender NVARCHAR(10) NULL CHECK (gender IN ('Male', 'Female', 'Other'));
GO

-- ── Add document_url to LeaveApplications (MAX for base64 images) ────────────
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.LeaveApplications') AND name = 'document_url')
    ALTER TABLE dbo.LeaveApplications ADD document_url NVARCHAR(MAX) NULL;
ELSE BEGIN
    -- If it exists but is too small, alter to MAX
    DECLARE @MaxLen INT;
    SELECT @MaxLen = max_length FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.LeaveApplications') AND name = 'document_url';
    IF @MaxLen != -1  -- -1 = MAX in sys.columns
        ALTER TABLE dbo.LeaveApplications ALTER COLUMN document_url NVARCHAR(MAX) NULL;
END
GO

-- ── Add rejection_reason to SalaryApprovals ───────────────────────────────────
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.SalaryApprovals') AND name = 'rejection_reason')
    ALTER TABLE dbo.SalaryApprovals ADD rejection_reason NVARCHAR(1000) NULL;
GO

-- ── Add max_maternity and max_paternity to LeavePolicy ────────────────────────
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.LeavePolicy') AND name = 'max_maternity')
    ALTER TABLE dbo.LeavePolicy ADD max_maternity INT NOT NULL DEFAULT 150;
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.LeavePolicy') AND name = 'max_paternity')
    ALTER TABLE dbo.LeavePolicy ADD max_paternity INT NOT NULL DEFAULT 15;
GO

-- ── Update LeavePolicy with official values ───────────────────────────────────
UPDATE dbo.LeavePolicy SET 
    max_sick = 15, 
    max_casual = 12, 
    max_earned = 20, 
    max_maternity = 150,    -- 5 months
    max_paternity = 15, 
    advance_days_required = 2, 
    admin_action_days = 5;
GO

-- ── Ensure Departments table has created_date (some installs may be missing it) 
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Departments') AND name = 'created_date')
    ALTER TABLE dbo.Departments ADD created_date DATETIME DEFAULT GETDATE();
GO

PRINT 'Migration completed successfully.';
GO
