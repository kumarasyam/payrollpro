-- Migration to expand document_url size
USE PayrollProDB;
GO

-- 1. Alter LeaveApplications table to allow large Base64 documents
ALTER TABLE dbo.LeaveApplications 
ALTER COLUMN document_url NVARCHAR(MAX) NULL;
GO

-- 2. Alter Attendance table to allow longer notes if needed
ALTER TABLE dbo.Attendance
ALTER COLUMN notes NVARCHAR(MAX) NULL;
GO

PRINT 'Database schema updated successfully: document_url is now NVARCHAR(MAX)';
GO
