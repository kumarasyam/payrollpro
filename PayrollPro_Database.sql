-- ============================================================
-- PayrollPro Database Script (Updated)
-- For: SQL Server Management Studio (SSMS) 2022
-- Description: Complete database schema for the PayrollPro
--              Payroll Management System
--              69 Employees | 8 Departments | Full Sample Data
--
-- HOW TO RUN:
--   STEP 1: In SSMS Object Explorer, right-click "Databases"
--           > Click "New Database..."
--           > Type: PayrollProDB
--           > Click OK
--   STEP 2: Then come back here and press F5 to run this script
-- ============================================================

USE PayrollProDB;
GO

-- ============================================================
-- Drop existing tables (if re-running this script)
-- ============================================================
IF OBJECT_ID('dbo.Attendance', 'U') IS NOT NULL DROP TABLE dbo.Attendance;
IF OBJECT_ID('dbo.SalaryApprovals', 'U') IS NOT NULL DROP TABLE dbo.SalaryApprovals;
IF OBJECT_ID('dbo.Payslips', 'U') IS NOT NULL DROP TABLE dbo.Payslips;
IF OBJECT_ID('dbo.LeaveApplications', 'U') IS NOT NULL DROP TABLE dbo.LeaveApplications;
IF OBJECT_ID('dbo.Employees', 'U') IS NOT NULL DROP TABLE dbo.Employees;
IF OBJECT_ID('dbo.Departments', 'U') IS NOT NULL DROP TABLE dbo.Departments;
IF OBJECT_ID('dbo.Users', 'U') IS NOT NULL DROP TABLE dbo.Users;
GO

-- ============================================================
-- Table 1: Users (Authentication & Authorization)
-- ============================================================
CREATE TABLE dbo.Users (
    id                  INT IDENTITY(1,1) PRIMARY KEY,
    email               NVARCHAR(255)   NOT NULL UNIQUE,
    password_hash       NVARCHAR(255)   NOT NULL,
    full_name           NVARCHAR(150)   NOT NULL,
    role                NVARCHAR(20)    NOT NULL DEFAULT 'employee'
                        CHECK (role IN ('admin', 'employee')),
    is_active           BIT             NOT NULL DEFAULT 1,
    gender              NVARCHAR(10)    NULL CHECK (gender IN ('Male', 'Female', 'Other')),
    created_date        DATETIME2       NOT NULL DEFAULT GETDATE(),
    updated_date        DATETIME2       NOT NULL DEFAULT GETDATE()
);
GO

-- ============================================================
-- Table 2: Departments
-- ============================================================
CREATE TABLE dbo.Departments (
    id                  INT IDENTITY(1,1) PRIMARY KEY,
    name                NVARCHAR(100)   NOT NULL UNIQUE,
    head                NVARCHAR(150)   NULL,
    description         NVARCHAR(500)   NULL,
    created_date        DATETIME2       NOT NULL DEFAULT GETDATE(),
    updated_date        DATETIME2       NOT NULL DEFAULT GETDATE()
);
GO

-- ============================================================
-- Table 3: Employees
-- ============================================================
CREATE TABLE dbo.Employees (
    id                  INT IDENTITY(1,1) PRIMARY KEY,
    full_name           NVARCHAR(150)   NOT NULL,
    email               NVARCHAR(255)   NOT NULL UNIQUE,
    phone               NVARCHAR(20)    NULL,
    department_id       INT             NULL,
    department          NVARCHAR(100)   NULL,
    designation         NVARCHAR(100)   NULL,
    date_of_joining     DATE            NULL,
    base_salary         DECIMAL(12,2)   NOT NULL DEFAULT 0,
    leave_balance       INT             NOT NULL DEFAULT 24,
    gender              NVARCHAR(10)    NULL CHECK (gender IN ('Male', 'Female', 'Other')),
    status              NVARCHAR(20)    NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive', 'on_leave')),
    created_date        DATETIME2       NOT NULL DEFAULT GETDATE(),
    updated_date        DATETIME2       NOT NULL DEFAULT GETDATE(),

    CONSTRAINT FK_Employee_Department
        FOREIGN KEY (department_id) REFERENCES dbo.Departments(id)
        ON DELETE SET NULL
);
GO

-- ============================================================
-- Table 4: Leave Applications
-- ============================================================
CREATE TABLE dbo.LeaveApplications (
    id                  INT IDENTITY(1,1) PRIMARY KEY,
    employee_name       NVARCHAR(150)   NOT NULL,
    employee_email      NVARCHAR(255)   NOT NULL,
    department          NVARCHAR(100)   NULL,
    leave_type          NVARCHAR(50)    NOT NULL
                        CHECK (leave_type IN ('casual', 'sick', 'earned', 'maternity', 'paternity', 'unpaid')),
    start_date          DATE            NOT NULL,
    end_date            DATE            NOT NULL,
    days                INT             NOT NULL DEFAULT 1,
    reason              NVARCHAR(500)   NULL,
    document_url        NVARCHAR(500)   NULL,
    status              NVARCHAR(20)    NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'approved', 'rejected')),
    approved_by         NVARCHAR(150)   NULL,
    remarks             NVARCHAR(500)   NULL,
    created_date        DATETIME2       NOT NULL DEFAULT GETDATE(),
    updated_date        DATETIME2       NOT NULL DEFAULT GETDATE(),

    CONSTRAINT FK_Leave_Employee
        FOREIGN KEY (employee_email) REFERENCES dbo.Employees(email)
        ON DELETE CASCADE
);
GO

-- ============================================================
-- Table 5: Payslips
-- ============================================================
CREATE TABLE dbo.Payslips (
    id                  INT IDENTITY(1,1) PRIMARY KEY,
    employee_name       NVARCHAR(150)   NOT NULL,
    employee_email      NVARCHAR(255)   NOT NULL,
    department          NVARCHAR(100)   NULL,
    month               NVARCHAR(30)    NOT NULL,

    -- Earnings
    base_salary         DECIMAL(12,2)   NOT NULL DEFAULT 0,
    hra                 DECIMAL(12,2)   NOT NULL DEFAULT 0,
    transport_allowance DECIMAL(12,2)   NOT NULL DEFAULT 0,
    medical_allowance   DECIMAL(12,2)   NOT NULL DEFAULT 0,
    bonus               DECIMAL(12,2)   NOT NULL DEFAULT 0,
    gross_salary        DECIMAL(12,2)   NOT NULL DEFAULT 0,

    -- Deductions
    tax_deduction       DECIMAL(12,2)   NOT NULL DEFAULT 0,
    provident_fund      DECIMAL(12,2)   NOT NULL DEFAULT 0,
    other_deductions    DECIMAL(12,2)   NOT NULL DEFAULT 0,
    total_deductions    DECIMAL(12,2)   NOT NULL DEFAULT 0,

    -- Net
    net_salary          DECIMAL(12,2)   NOT NULL DEFAULT 0,

    status              NVARCHAR(20)    NOT NULL DEFAULT 'generated'
                        CHECK (status IN ('generated', 'paid', 'cancelled')),
    payment_date        DATE            NULL,
    created_date        DATETIME2       NOT NULL DEFAULT GETDATE(),
    updated_date        DATETIME2       NOT NULL DEFAULT GETDATE(),

    CONSTRAINT FK_Payslip_Employee
        FOREIGN KEY (employee_email) REFERENCES dbo.Employees(email)
        ON DELETE CASCADE
);
GO

-- ============================================================
-- Table 6: Salary Approvals
-- ============================================================
CREATE TABLE dbo.SalaryApprovals (
    id                  INT IDENTITY(1,1) PRIMARY KEY,
    employee_name       NVARCHAR(150)   NOT NULL,
    employee_email      NVARCHAR(255)   NOT NULL,
    department          NVARCHAR(100)   NULL,
    change_type         NVARCHAR(30)    NOT NULL DEFAULT 'raise'
                        CHECK (change_type IN ('raise', 'bonus', 'advance', 'other')),
    current_salary      DECIMAL(12,2)   NOT NULL DEFAULT 0,
    proposed_salary     DECIMAL(12,2)   NOT NULL DEFAULT 0,
    month               NVARCHAR(30)    NULL,
    reason              NVARCHAR(500)   NULL,
    rejection_reason    NVARCHAR(500)   NULL,
    status              NVARCHAR(20)    NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'approved', 'rejected')),
    approved_by         NVARCHAR(150)   NULL,
    created_date        DATETIME2       NOT NULL DEFAULT GETDATE(),
    updated_date        DATETIME2       NOT NULL DEFAULT GETDATE(),

    CONSTRAINT FK_SalaryApproval_Employee
        FOREIGN KEY (employee_email) REFERENCES dbo.Employees(email)
        ON DELETE CASCADE
);
GO

-- ============================================================
-- Table 7: Attendance
-- ============================================================
CREATE TABLE dbo.Attendance (
    id                  INT IDENTITY(1,1) PRIMARY KEY,
    employee_name       NVARCHAR(150)   NOT NULL,
    employee_email      NVARCHAR(255)   NOT NULL,
    department          NVARCHAR(100)   NULL,
    date                DATE            NOT NULL,
    status              NVARCHAR(20)    NOT NULL DEFAULT 'present'
                        CHECK (status IN ('present', 'half_day', 'on_leave', 'holiday')),
    check_in            TIME            NULL,
    check_out           TIME            NULL,
    worked_hours        DECIMAL(4,1)    NOT NULL DEFAULT 0,
    overtime_hours      DECIMAL(4,1)    NOT NULL DEFAULT 0,
    notes               NVARCHAR(500)   NULL,
    created_date        DATETIME2       NOT NULL DEFAULT GETDATE(),
    updated_date        DATETIME2       NOT NULL DEFAULT GETDATE(),

    CONSTRAINT UQ_Attendance_Employee_Date
        UNIQUE (employee_email, date),

    CONSTRAINT FK_Attendance_Employee
        FOREIGN KEY (employee_email) REFERENCES dbo.Employees(email)
        ON DELETE CASCADE
);
GO

-- ============================================================
-- Table 8: Leave Policy (Company Rules)
-- ============================================================
CREATE TABLE dbo.LeavePolicy (
    id                  INT IDENTITY(1,1) PRIMARY KEY,
    max_sick            INT             NOT NULL DEFAULT 15,
    max_casual          INT             NOT NULL DEFAULT 12,
    max_earned          INT             NOT NULL DEFAULT 20,
    max_maternity       INT             NOT NULL DEFAULT 90,
    max_paternity       INT             NOT NULL DEFAULT 15,
    advance_days_required INT           NOT NULL DEFAULT 2,
    admin_action_days   INT             NOT NULL DEFAULT 5,
    updated_date        DATETIME2       NOT NULL DEFAULT GETDATE()
);
GO

INSERT INTO dbo.LeavePolicy (max_sick, max_casual, max_earned, max_maternity, max_paternity, advance_days_required, admin_action_days)
VALUES (15, 12, 20, 90, 15, 2, 5);
GO


-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IX_Employees_Department ON dbo.Employees(department);
CREATE INDEX IX_Employees_Status ON dbo.Employees(status);
CREATE INDEX IX_Employees_Email ON dbo.Employees(email);
CREATE INDEX IX_LeaveApplications_Email ON dbo.LeaveApplications(employee_email);
CREATE INDEX IX_LeaveApplications_Status ON dbo.LeaveApplications(status);
CREATE INDEX IX_Payslips_Email ON dbo.Payslips(employee_email);
CREATE INDEX IX_Payslips_Month ON dbo.Payslips(month);
CREATE INDEX IX_SalaryApprovals_Email ON dbo.SalaryApprovals(employee_email);
CREATE INDEX IX_SalaryApprovals_Status ON dbo.SalaryApprovals(status);
CREATE INDEX IX_Attendance_Email ON dbo.Attendance(employee_email);
CREATE INDEX IX_Attendance_Date ON dbo.Attendance(date);
GO


-- ============================================================
-- INSERT: Admin User
-- ============================================================
INSERT INTO dbo.Users (email, password_hash, full_name, role) VALUES
('admin@payrollpro.com', 'admin123', 'Admin User', 'admin');
GO


-- ============================================================
-- INSERT: 8 Departments
-- ============================================================
INSERT INTO dbo.Departments (name, head, description) VALUES
('Engineering',      'Ravi Kumar',    'Software Development & Engineering team'),
('Human Resources',  'Priya Sharma',  'HR, Recruitment & Employee Relations'),
('Finance',          'Anil Mehta',    'Accounting, Payroll & Financial Planning'),
('Marketing',        'Sneha Reddy',   'Brand, Digital Marketing & Communications'),
('Operations',       'Vikram Singh',  'Business Operations & Logistics'),
('Sales',            'Nikhil Jain',   'Sales, Business Development & Revenue'),
('IT Support',       'Naveen Kumar',  'IT Infrastructure, Support & Security'),
('HR',               'Sunita Patel',  'Human Resources Operations & Talent Management');
GO

PRINT '8 departments created';
GO


-- ============================================================
-- INSERT: 69 Employees
-- ============================================================
INSERT INTO dbo.Employees (full_name, email, phone, department_id, department, designation, date_of_joining, base_salary, leave_balance, status) VALUES
-- Original 8
('Rahul Sharma',       'rahul.sharma@payrollpro.com',       '+91 90000 10000', 1, 'Engineering',      'Senior Developer',           '2021-01-01', 75000, 24, 'active'),
('Anita Desai',        'anita.desai@payrollpro.com',        '+91 91111 10777', 1, 'Engineering',      'Full Stack Developer',       '2022-02-08', 60000, 24, 'active'),
('Suresh Patel',       'suresh.patel@payrollpro.com',       '+91 92222 11554', 2, 'Human Resources',  'HR Manager',                 '2023-03-15', 65000, 24, 'active'),
('Deepika Nair',       'deepika.nair@payrollpro.com',       '+91 93333 12331', 3, 'Finance',          'Accountant',                 '2024-04-22', 55000, 24, 'active'),
('Arjun Reddy',        'arjun.reddy@payrollpro.com',        '+91 94444 13108', 4, 'Marketing',        'Marketing Executive',        '2025-05-01', 50000, 24, 'active'),
('Kavitha Iyer',       'kavitha.iyer@payrollpro.com',       '+91 95555 13885', 5, 'Operations',       'Operations Lead',            '2021-06-08', 70000, 24, 'active'),
('Manoj Kumar',        'manoj.kumar@payrollpro.com',        '+91 96666 14662', 1, 'Engineering',      'Junior Developer',           '2022-07-15', 40000, 24, 'active'),
('Pooja Gupta',        'pooja.gupta@payrollpro.com',        '+91 97777 15439', 3, 'Finance',          'Finance Analyst',            '2023-08-22', 52000, 24, 'active'),
-- New 61 employees
('Vikram Singh',       'vikram.singh@payrollpro.com',       '+91 98888 16216', 1, 'Engineering',      'Software Engineer',          '2024-09-01', 58000, 24, 'active'),
('Neha Verma',         'neha.verma@payrollpro.com',         '+91 99999 16993', 4, 'Marketing',        'SEO Specialist',             '2025-10-08', 45000, 24, 'active'),
('Rohit Agarwal',      'rohit.agarwal@payrollpro.com',      '+91 01110 17770', 6, 'Sales',            'Sales Executive',            '2021-11-15', 48000, 24, 'active'),
('Priya Menon',        'priya.menon@payrollpro.com',        '+91 02221 18547', 8, 'HR',               'HR Executive',               '2022-12-22', 42000, 24, 'active'),
('Kiran Das',          'kiran.das@payrollpro.com',          '+91 03332 19324', 7, 'IT Support',       'System Administrator',       '2023-01-01', 55000, 24, 'active'),
('Sneha Kapoor',       'sneha.kapoor@payrollpro.com',       '+91 04443 20101', 3, 'Finance',          'Auditor',                    '2024-02-08', 60000, 24, 'active'),
('Ajay Mishra',        'ajay.mishra@payrollpro.com',        '+91 05554 20878', 1, 'Engineering',      'Backend Developer',          '2025-03-15', 62000, 24, 'active'),
('Meena Joshi',        'meena.joshi@payrollpro.com',        '+91 06665 21655', 5, 'Operations',       'Operations Manager',         '2021-04-22', 68000, 24, 'active'),
('Varun Mehta',        'varun.mehta@payrollpro.com',        '+91 07776 22432', 4, 'Marketing',        'Digital Marketer',           '2022-05-01', 46000, 24, 'active'),
('Nikhil Jain',        'nikhil.jain@payrollpro.com',        '+91 08887 23209', 6, 'Sales',            'Sales Manager',              '2023-06-08', 66000, 24, 'active'),
('Aditi Rao',          'aditi.rao@payrollpro.com',          '+91 09998 23986', 1, 'Engineering',      'Frontend Developer',         '2024-07-15', 57000, 24, 'active'),
('Rakesh Yadav',       'rakesh.yadav@payrollpro.com',       '+91 11109 24763', 7, 'IT Support',       'Network Engineer',           '2025-08-22', 54000, 24, 'active'),
('Divya Sharma',       'divya.sharma@payrollpro.com',       '+91 12220 25540', 3, 'Finance',          'Finance Manager',            '2021-09-01', 72000, 24, 'active'),
('Tarun Khanna',       'tarun.khanna@payrollpro.com',       '+91 13331 26317', 1, 'Engineering',      'DevOps Engineer',            '2022-10-08', 63000, 24, 'active'),
('Anjali Gupta',       'anjali.gupta@payrollpro.com',       '+91 14442 27094', 8, 'HR',               'HR Assistant',               '2023-11-15', 38000, 24, 'active'),
('Sunil Verma',        'sunil.verma@payrollpro.com',        '+91 15553 27871', 5, 'Operations',       'Supervisor',                 '2024-12-22', 49000, 24, 'active'),
('Pankaj Bansal',      'pankaj.bansal@payrollpro.com',      '+91 16664 28648', 6, 'Sales',            'Sales Associate',            '2025-01-01', 41000, 24, 'active'),
('Ritu Sharma',        'ritu.sharma@payrollpro.com',        '+91 17775 29425', 4, 'Marketing',        'Content Writer',             '2021-02-08', 44000, 24, 'active'),
('Abhishek Tiwari',    'abhishek.tiwari@payrollpro.com',    '+91 18886 30202', 1, 'Engineering',      'QA Engineer',                '2022-03-15', 50000, 24, 'active'),
('Shalini Nair',       'shalini.nair@payrollpro.com',       '+91 19997 30979', 3, 'Finance',          'Accounts Executive',         '2023-04-22', 47000, 24, 'active'),
('Gaurav Kapoor',      'gaurav.kapoor@payrollpro.com',      '+91 21108 31756', 7, 'IT Support',       'Technical Support',          '2024-05-01', 43000, 24, 'active'),
('Mohit Jain',         'mohit.jain@payrollpro.com',         '+91 22219 32533', 1, 'Engineering',      'Software Engineer',          '2025-06-08', 56000, 24, 'active'),
('Nisha Patel',        'nisha.patel@payrollpro.com',        '+91 23330 33310', 4, 'Marketing',        'Social Media Manager',       '2021-07-15', 52000, 24, 'active'),
('Amit Kumar',         'amit.kumar@payrollpro.com',         '+91 24441 34087', 6, 'Sales',            'Business Development Executive', '2022-08-22', 53000, 24, 'active'),
('Rekha Reddy',        'rekha.reddy@payrollpro.com',        '+91 25552 34864', 8, 'HR',               'Recruitment Specialist',     '2023-09-01', 48000, 24, 'active'),
('Sanjay Gupta',       'sanjay.gupta@payrollpro.com',       '+91 26663 35641', 5, 'Operations',       'Logistics Manager',          '2024-10-08', 61000, 24, 'active'),
('Alok Singh',         'alok.singh@payrollpro.com',         '+91 27774 36418', 1, 'Engineering',      'Data Engineer',              '2025-11-15', 64000, 24, 'active'),
('Pooja Sharma',       'pooja.sharma@payrollpro.com',       '+91 28885 37195', 3, 'Finance',          'Tax Consultant',             '2021-12-22', 59000, 24, 'active'),
('Naveen Kumar',       'naveen.kumar@payrollpro.com',       '+91 29996 37972', 7, 'IT Support',       'IT Manager',                 '2022-01-01', 69000, 24, 'active'),
('Kavya Iyer',         'kavya.iyer@payrollpro.com',         '+91 31107 38749', 4, 'Marketing',        'Brand Manager',              '2023-02-08', 67000, 24, 'active'),
('Rajesh Patel',       'rajesh.patel@payrollpro.com',       '+91 32218 39526', 6, 'Sales',            'Regional Sales Manager',     '2024-03-15', 74000, 24, 'active'),
('Deepak Verma',       'deepak.verma@payrollpro.com',       '+91 33329 40303', 1, 'Engineering',      'Machine Learning Engineer',  '2025-04-22', 76000, 24, 'active'),
('Ananya Das',         'ananya.das@payrollpro.com',         '+91 34440 41080', 8, 'HR',               'HR Coordinator',             '2021-05-01', 45000, 24, 'active'),
('Manish Yadav',       'manish.yadav@payrollpro.com',       '+91 35551 41857', 5, 'Operations',       'Operations Executive',       '2022-06-08', 47000, 24, 'active'),
('Rohan Kapoor',       'rohan.kapoor@payrollpro.com',       '+91 36662 42634', 1, 'Engineering',      'Mobile App Developer',       '2023-07-15', 58000, 24, 'active'),
('Shruti Mehta',       'shruti.mehta@payrollpro.com',       '+91 37773 43411', 3, 'Finance',          'Budget Analyst',             '2024-08-22', 55000, 24, 'active'),
('Arvind Kumar',       'arvind.kumar@payrollpro.com',       '+91 38884 44188', 7, 'IT Support',       'Helpdesk Engineer',          '2025-09-01', 41000, 24, 'active'),
('Swati Gupta',        'swati.gupta@payrollpro.com',        '+91 39995 44965', 4, 'Marketing',        'Campaign Manager',           '2021-10-08', 62000, 24, 'active'),
('Harish Patel',       'harish.patel@payrollpro.com',       '+91 41106 45742', 6, 'Sales',            'Sales Coordinator',          '2022-11-15', 44000, 24, 'active'),
('Karthik Reddy',      'karthik.reddy@payrollpro.com',      '+91 42217 46519', 1, 'Engineering',      'Software Architect',         '2023-12-22', 85000, 24, 'active'),
('Bhavana Nair',       'bhavana.nair@payrollpro.com',       '+91 43328 47296', 8, 'HR',               'Talent Acquisition',         '2024-01-01', 51000, 24, 'active'),
('Prakash Singh',      'prakash.singh@payrollpro.com',      '+91 44439 48073', 5, 'Operations',       'Warehouse Manager',          '2025-02-08', 57000, 24, 'active'),
('Shyam Kumar',        'shyam.kumar@payrollpro.com',        '+91 45550 48850', 1, 'Engineering',      'Cloud Engineer',             '2021-03-15', 66000, 24, 'active'),
('Neelam Sharma',      'neelam.sharma@payrollpro.com',      '+91 46661 49627', 3, 'Finance',          'Payroll Specialist',         '2022-04-22', 54000, 24, 'active'),
('Vijay Mishra',       'vijay.mishra@payrollpro.com',       '+91 47772 50404', 7, 'IT Support',       'Security Analyst',           '2023-05-01', 60000, 24, 'active'),
('Jyoti Verma',        'jyoti.verma@payrollpro.com',        '+91 48883 51181', 4, 'Marketing',        'PR Manager',                 '2024-06-08', 63000, 24, 'active'),
('Rajiv Agarwal',      'rajiv.agarwal@payrollpro.com',      '+91 49994 51958', 6, 'Sales',            'Territory Manager',          '2025-07-15', 65000, 24, 'active'),
('Sunita Patel',       'sunita.patel@payrollpro.com',       '+91 51105 52735', 8, 'HR',               'HR Business Partner',        '2021-08-22', 70000, 24, 'active'),
('Aditya Rao',         'aditya.rao@payrollpro.com',         '+91 52216 53512', 1, 'Engineering',      'Data Scientist',             '2022-09-01', 80000, 24, 'active'),
('Kunal Mehta',        'kunal.mehta@payrollpro.com',        '+91 53327 54289', 1, 'Engineering',      'Backend Developer',          '2023-10-08', 59000, 24, 'active'),
('Priti Singh',        'priti.singh@payrollpro.com',        '+91 54438 55066', 3, 'Finance',          'Financial Planner',          '2024-11-15', 58000, 24, 'active'),
('Sandeep Kumar',      'sandeep.kumar@payrollpro.com',      '+91 55549 55843', 5, 'Operations',       'Operations Analyst',         '2025-12-22', 52000, 24, 'active'),
('Vivek Sharma',       'vivek.sharma@payrollpro.com',       '+91 56660 56620', 7, 'IT Support',       'IT Technician',              '2021-01-01', 39000, 24, 'active'),
('Ritu Agarwal',       'ritu.agarwal@payrollpro.com',       '+91 57771 57397', 4, 'Marketing',        'Marketing Analyst',          '2022-02-08', 50000, 24, 'active'),
('Ashok Yadav',        'ashok.yadav@payrollpro.com',        '+91 58882 58174', 6, 'Sales',            'Sales Consultant',           '2023-03-15', 48000, 24, 'active'),
('Ramesh Patel',       'ramesh.patel@payrollpro.com',       '+91 59993 58951', 1, 'Engineering',      'System Engineer',            '2024-04-22', 57000, 24, 'active'),
('Shobha Nair',        'shobha.nair@payrollpro.com',        '+91 61104 59728', 3, 'Finance',          'Senior Accountant',          '2025-05-01', 68000, 24, 'active'),
('Devendra Singh',     'devendra.singh@payrollpro.com',     '+91 62215 60505', 5, 'Operations',       'Supply Chain Manager',       '2021-06-08', 71000, 24, 'active'),
('Arpita Das',         'arpita.das@payrollpro.com',         '+91 63326 61282', 8, 'HR',               'HR Executive',               '2022-07-15', 46000, 24, 'active'),
('Kiran Reddy',        'kiran.reddy@payrollpro.com',        '+91 64437 62059', 1, 'Engineering',      'Full Stack Developer',       '2023-08-22', 61000, 24, 'active'),
('Mahesh Kumar',       'mahesh.kumar@payrollpro.com',       '+91 65548 62836', 7, 'IT Support',       'Network Administrator',      '2024-09-01', 56000, 24, 'active');
GO

-- ============================================================
-- INSERT: User accounts for all employees (password: emp123)
-- ============================================================
INSERT INTO dbo.Users (email, password_hash, full_name, role) VALUES
('rahul.sharma@payrollpro.com',    'emp123', 'Rahul Sharma',       'employee'),
('anita.desai@payrollpro.com',     'emp123', 'Anita Desai',        'employee'),
('suresh.patel@payrollpro.com',    'emp123', 'Suresh Patel',       'employee'),
('deepika.nair@payrollpro.com',    'emp123', 'Deepika Nair',       'employee'),
('arjun.reddy@payrollpro.com',     'emp123', 'Arjun Reddy',        'employee'),
('kavitha.iyer@payrollpro.com',    'emp123', 'Kavitha Iyer',       'employee'),
('manoj.kumar@payrollpro.com',     'emp123', 'Manoj Kumar',        'employee'),
('pooja.gupta@payrollpro.com',     'emp123', 'Pooja Gupta',        'employee'),
('vikram.singh@payrollpro.com',    'emp123', 'Vikram Singh',       'employee'),
('neha.verma@payrollpro.com',      'emp123', 'Neha Verma',         'employee'),
('rohit.agarwal@payrollpro.com',   'emp123', 'Rohit Agarwal',      'employee'),
('priya.menon@payrollpro.com',     'emp123', 'Priya Menon',        'employee'),
('kiran.das@payrollpro.com',       'emp123', 'Kiran Das',          'employee'),
('sneha.kapoor@payrollpro.com',    'emp123', 'Sneha Kapoor',       'employee'),
('ajay.mishra@payrollpro.com',     'emp123', 'Ajay Mishra',        'employee'),
('meena.joshi@payrollpro.com',     'emp123', 'Meena Joshi',        'employee'),
('varun.mehta@payrollpro.com',     'emp123', 'Varun Mehta',        'employee'),
('nikhil.jain@payrollpro.com',     'emp123', 'Nikhil Jain',        'employee'),
('aditi.rao@payrollpro.com',       'emp123', 'Aditi Rao',          'employee'),
('rakesh.yadav@payrollpro.com',    'emp123', 'Rakesh Yadav',       'employee'),
('divya.sharma@payrollpro.com',    'emp123', 'Divya Sharma',       'employee'),
('tarun.khanna@payrollpro.com',    'emp123', 'Tarun Khanna',       'employee'),
('anjali.gupta@payrollpro.com',    'emp123', 'Anjali Gupta',       'employee'),
('sunil.verma@payrollpro.com',     'emp123', 'Sunil Verma',        'employee'),
('pankaj.bansal@payrollpro.com',   'emp123', 'Pankaj Bansal',      'employee'),
('ritu.sharma@payrollpro.com',     'emp123', 'Ritu Sharma',        'employee'),
('abhishek.tiwari@payrollpro.com', 'emp123', 'Abhishek Tiwari',    'employee'),
('shalini.nair@payrollpro.com',    'emp123', 'Shalini Nair',       'employee'),
('gaurav.kapoor@payrollpro.com',   'emp123', 'Gaurav Kapoor',      'employee'),
('mohit.jain@payrollpro.com',      'emp123', 'Mohit Jain',         'employee'),
('nisha.patel@payrollpro.com',     'emp123', 'Nisha Patel',        'employee'),
('amit.kumar@payrollpro.com',      'emp123', 'Amit Kumar',         'employee'),
('rekha.reddy@payrollpro.com',     'emp123', 'Rekha Reddy',        'employee'),
('sanjay.gupta@payrollpro.com',    'emp123', 'Sanjay Gupta',       'employee'),
('alok.singh@payrollpro.com',      'emp123', 'Alok Singh',         'employee'),
('pooja.sharma@payrollpro.com',    'emp123', 'Pooja Sharma',       'employee'),
('naveen.kumar@payrollpro.com',    'emp123', 'Naveen Kumar',       'employee'),
('kavya.iyer@payrollpro.com',      'emp123', 'Kavya Iyer',         'employee'),
('rajesh.patel@payrollpro.com',    'emp123', 'Rajesh Patel',       'employee'),
('deepak.verma@payrollpro.com',    'emp123', 'Deepak Verma',       'employee'),
('ananya.das@payrollpro.com',      'emp123', 'Ananya Das',         'employee'),
('manish.yadav@payrollpro.com',    'emp123', 'Manish Yadav',       'employee'),
('rohan.kapoor@payrollpro.com',    'emp123', 'Rohan Kapoor',       'employee'),
('shruti.mehta@payrollpro.com',    'emp123', 'Shruti Mehta',       'employee'),
('arvind.kumar@payrollpro.com',    'emp123', 'Arvind Kumar',       'employee'),
('swati.gupta@payrollpro.com',     'emp123', 'Swati Gupta',        'employee'),
('harish.patel@payrollpro.com',    'emp123', 'Harish Patel',       'employee'),
('karthik.reddy@payrollpro.com',   'emp123', 'Karthik Reddy',      'employee'),
('bhavana.nair@payrollpro.com',    'emp123', 'Bhavana Nair',       'employee'),
('prakash.singh@payrollpro.com',   'emp123', 'Prakash Singh',      'employee'),
('shyam.kumar@payrollpro.com',    'emp123', 'Shyam Kumar',        'employee'),
('neelam.sharma@payrollpro.com',   'emp123', 'Neelam Sharma',      'employee'),
('vijay.mishra@payrollpro.com',    'emp123', 'Vijay Mishra',       'employee'),
('jyoti.verma@payrollpro.com',     'emp123', 'Jyoti Verma',        'employee'),
('rajiv.agarwal@payrollpro.com',   'emp123', 'Rajiv Agarwal',      'employee'),
('sunita.patel@payrollpro.com',    'emp123', 'Sunita Patel',       'employee'),
('aditya.rao@payrollpro.com',      'emp123', 'Aditya Rao',         'employee'),
('kunal.mehta@payrollpro.com',     'emp123', 'Kunal Mehta',        'employee'),
('priti.singh@payrollpro.com',     'emp123', 'Priti Singh',        'employee'),
('sandeep.kumar@payrollpro.com',   'emp123', 'Sandeep Kumar',      'employee'),
('vivek.sharma@payrollpro.com',    'emp123', 'Vivek Sharma',       'employee'),
('ritu.agarwal@payrollpro.com',    'emp123', 'Ritu Agarwal',       'employee'),
('ashok.yadav@payrollpro.com',     'emp123', 'Ashok Yadav',        'employee'),
('ramesh.patel@payrollpro.com',    'emp123', 'Ramesh Patel',       'employee'),
('shobha.nair@payrollpro.com',     'emp123', 'Shobha Nair',        'employee'),
('devendra.singh@payrollpro.com',  'emp123', 'Devendra Singh',     'employee'),
('arpita.das@payrollpro.com',      'emp123', 'Arpita Das',         'employee'),
('kiran.reddy@payrollpro.com',     'emp123', 'Kiran Reddy',        'employee'),
('mahesh.kumar@payrollpro.com',    'emp123', 'Mahesh Kumar',       'employee');
GO

PRINT '69 employees and user accounts created (password: emp123)';
GO


-- ============================================================
-- INSERT: Payslips for ALL 69 employees (February 2026)
-- Formula: HRA=10%, Transport=200, Medical=150, Tax=10% of Gross, PF=12% of Base
-- ============================================================
INSERT INTO dbo.Payslips (employee_name, employee_email, department, month, base_salary, hra, transport_allowance, medical_allowance, bonus, gross_salary, tax_deduction, provident_fund, other_deductions, total_deductions, net_salary, status)
SELECT
    e.full_name,
    e.email,
    e.department,
    'February 2026',
    e.base_salary,
    ROUND(e.base_salary * 0.10, 2),                                                          -- HRA
    200,                                                                                       -- Transport
    150,                                                                                       -- Medical
    0,                                                                                         -- Bonus
    e.base_salary + ROUND(e.base_salary * 0.10, 2) + 200 + 150,                              -- Gross
    ROUND((e.base_salary + ROUND(e.base_salary * 0.10, 2) + 200 + 150) * 0.10, 2),           -- Tax (10% of gross)
    ROUND(e.base_salary * 0.12, 2),                                                           -- PF (12% of base)
    0,                                                                                         -- Other deductions
    ROUND((e.base_salary + ROUND(e.base_salary * 0.10, 2) + 200 + 150) * 0.10, 2)
        + ROUND(e.base_salary * 0.12, 2),                                                     -- Total deductions
    (e.base_salary + ROUND(e.base_salary * 0.10, 2) + 200 + 150)
        - ROUND((e.base_salary + ROUND(e.base_salary * 0.10, 2) + 200 + 150) * 0.10, 2)
        - ROUND(e.base_salary * 0.12, 2),                                                     -- Net salary
    'paid'
FROM dbo.Employees e
WHERE e.date_of_joining < '2026-02-01'; -- Only generate for those who completed at least 1 full month by February
GO

PRINT '69 payslips generated for February 2026';
GO


-- ============================================================
-- INSERT: Leave Applications (15 sample requests)
-- ============================================================
INSERT INTO dbo.LeaveApplications (employee_name, employee_email, department, leave_type, start_date, end_date, days, reason, status, approved_by) VALUES
('Rahul Sharma',    'rahul.sharma@payrollpro.com',    'Engineering',   'casual',  '2026-03-05', '2026-03-07', 3, 'Personal work',       'pending',   NULL),
('Anita Desai',     'anita.desai@payrollpro.com',     'Engineering',   'sick',    '2026-03-07', '2026-03-09', 3, 'Fever and cold',      'approved',  'Admin User'),
('Deepika Nair',    'deepika.nair@payrollpro.com',    'Finance',       'earned',  '2026-03-09', '2026-03-12', 4, 'Family vacation',     'rejected',  'Admin User'),
('Manoj Kumar',     'manoj.kumar@payrollpro.com',     'Engineering',   'casual',  '2026-03-11', '2026-03-12', 2, 'Doctor appointment',  'pending',   NULL),
('Neha Verma',      'neha.verma@payrollpro.com',      'Marketing',     'sick',    '2026-03-13', '2026-03-15', 3, 'Family function',     'approved',  'Admin User'),
('Kiran Das',       'kiran.das@payrollpro.com',       'IT Support',    'earned',  '2026-03-15', '2026-03-19', 4, 'Medical checkup',     'rejected',  'Admin User'),
('Meena Joshi',     'meena.joshi@payrollpro.com',     'Operations',    'casual',  '2026-03-17', '2026-03-18', 2, 'Personal emergency',  'pending',   NULL),
('Divya Sharma',    'divya.sharma@payrollpro.com',    'Finance',       'sick',    '2026-03-19', '2026-03-21', 3, 'Travel plans',        'approved',  'Admin User'),
('Ritu Sharma',     'ritu.sharma@payrollpro.com',     'Marketing',     'casual',  '2026-03-21', '2026-03-23', 3, 'Personal work',       'rejected',  'Admin User'),
('Nisha Patel',     'nisha.patel@payrollpro.com',     'Marketing',     'sick',    '2026-03-07', '2026-03-08', 2, 'Fever and cold',      'pending',   NULL),
('Pooja Sharma',    'pooja.sharma@payrollpro.com',    'Finance',       'earned',  '2026-03-09', '2026-03-12', 4, 'Family vacation',     'approved',  'Admin User'),
('Ananya Das',      'ananya.das@payrollpro.com',      'HR',            'casual',  '2026-03-11', '2026-03-12', 2, 'Doctor appointment',  'rejected',  'Admin User'),
('Swati Gupta',     'swati.gupta@payrollpro.com',     'Marketing',     'sick',    '2026-03-13', '2026-03-15', 3, 'Family function',     'pending',   NULL),
('Shyam Kumar',     'shyam.kumar@payrollpro.com',     'Engineering',   'casual',  '2026-03-15', '2026-03-17', 3, 'Medical checkup',     'approved',  'Admin User'),
('Sunita Patel',    'sunita.patel@payrollpro.com',    'HR',            'sick',    '2026-03-17', '2026-03-20', 4, 'Personal emergency',  'rejected',  'Admin User');
GO

PRINT '15 leave applications inserted';
GO


-- ============================================================
-- INSERT: Attendance for today (all 69 employees)
-- ============================================================
DECLARE @today DATE = CAST(GETDATE() AS DATE);

-- Use a pattern: mostly present, some absent/half_day/on_leave
INSERT INTO dbo.Attendance (employee_name, employee_email, department, date, status, check_in, check_out, worked_hours, overtime_hours, notes)
SELECT
    e.full_name,
    e.email,
    e.department,
    @today,
    CASE
        WHEN e.id % 10 = 7 THEN 'absent'
        WHEN e.id % 10 = 8 THEN 'half_day'
        WHEN e.id % 10 = 9 THEN 'on_leave'
        ELSE 'present'
    END,
    CASE
        WHEN e.id % 10 IN (7, 9) THEN NULL
        ELSE CAST(DATEADD(MINUTE, (e.id % 3) * 30, '08:00') AS TIME)
    END,
    CASE
        WHEN e.id % 10 IN (7, 9) THEN NULL
        WHEN e.id % 10 = 8 THEN '13:00'
        ELSE CAST(DATEADD(MINUTE, (e.id % 3) * 30, '17:00') AS TIME)
    END,
    CASE
        WHEN e.id % 10 IN (7, 9) THEN 0
        WHEN e.id % 10 = 8 THEN 4.0
        ELSE 8.0 + (e.id % 3) * 0.5
    END,
    CASE
        WHEN e.id % 10 IN (7, 8, 9) THEN 0
        ELSE CASE WHEN (e.id % 3) * 0.5 > 0 THEN (e.id % 3) * 0.5 ELSE 0 END
    END,
    CASE
        WHEN e.id % 10 = 7 THEN 'Not available'
        WHEN e.id % 10 = 9 THEN 'On leave'
        ELSE ''
    END
FROM dbo.Employees e;
GO

PRINT '69 attendance records for today inserted';
GO


-- ============================================================
-- INSERT: Salary Approval Requests (6 requests)
-- ============================================================
INSERT INTO dbo.SalaryApprovals (employee_name, employee_email, department, change_type, current_salary, proposed_salary, month, reason, status, approved_by) VALUES
('Rahul Sharma',   'rahul.sharma@payrollpro.com',   'Engineering', 'raise',     75000, 85000, 'March 2026', 'Excellent performance in Q4, led 3 successful project deliveries',  'pending',  NULL),
('Arjun Reddy',    'arjun.reddy@payrollpro.com',    'Marketing',   'promotion', 50000, 62000, 'March 2026', 'Promoted to Senior Marketing Executive',                            'pending',  NULL),
('Manoj Kumar',    'manoj.kumar@payrollpro.com',     'Engineering', 'raise',     40000, 48000, 'March 2026', 'Completed 1 year, requesting annual increment',                     'approved', 'Admin User'),
('Karthik Reddy',  'karthik.reddy@payrollpro.com',  'Engineering', 'raise',     85000, 95000, 'March 2026', 'Leading architecture team, consistent delivery',                    'pending',  NULL),
('Nikhil Jain',    'nikhil.jain@payrollpro.com',     'Sales',       'bonus',     66000, 72000, 'March 2026', 'Exceeded Q4 sales target by 150%',                                  'approved', 'Admin User'),
('Divya Sharma',   'divya.sharma@payrollpro.com',    'Finance',     'promotion', 72000, 82000, 'March 2026', 'Promoted to Senior Finance Manager',                                'pending',  NULL);
GO

PRINT '6 salary approval requests inserted';
GO


-- ============================================================
-- Stored Procedures
-- ============================================================

-- SP 1: Employee Dashboard
CREATE OR ALTER PROCEDURE sp_GetEmployeeDashboard
    @EmployeeEmail NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT * FROM dbo.Employees WHERE email = @EmployeeEmail;

    SELECT
        COUNT(CASE WHEN status = 'pending' THEN 1 END)  AS PendingLeaves,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) AS ApprovedLeaves,
        SUM(CASE WHEN status = 'approved' THEN days ELSE 0 END) AS TotalDaysUsed
    FROM dbo.LeaveApplications WHERE employee_email = @EmployeeEmail;

    SELECT TOP 1 * FROM dbo.Payslips
    WHERE employee_email = @EmployeeEmail ORDER BY created_date DESC;

    SELECT
        COUNT(CASE WHEN status = 'present' THEN 1 END)  AS PresentDays,
        COUNT(CASE WHEN status = 'absent' THEN 1 END)   AS AbsentDays,
        COUNT(CASE WHEN status = 'half_day' THEN 1 END) AS HalfDays,
        SUM(ISNULL(overtime_hours, 0))                    AS TotalOvertime
    FROM dbo.Attendance
    WHERE employee_email = @EmployeeEmail
      AND MONTH(date) = MONTH(GETDATE()) AND YEAR(date) = YEAR(GETDATE());
END
GO

-- SP 2: Admin Dashboard
CREATE OR ALTER PROCEDURE sp_GetAdminDashboard
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        (SELECT COUNT(*) FROM dbo.Employees WHERE status = 'active')             AS TotalEmployees,
        (SELECT COUNT(*) FROM dbo.Departments)                                    AS TotalDepartments,
        (SELECT COUNT(*) FROM dbo.LeaveApplications WHERE status = 'pending')     AS PendingLeaves,
        (SELECT COUNT(*) FROM dbo.SalaryApprovals WHERE status = 'pending')       AS PendingSalaryApprovals,
        (SELECT COUNT(*) FROM dbo.Payslips)                                       AS TotalPayslips,
        (SELECT ISNULL(SUM(net_salary), 0) FROM dbo.Payslips WHERE status = 'paid'
            AND month = FORMAT(GETDATE(), 'MMMM yyyy'))                           AS MonthlyPayroll;
END
GO

-- SP 3: Generate Payslip
CREATE OR ALTER PROCEDURE sp_GeneratePayslip
    @EmployeeEmail  NVARCHAR(255),
    @Month          NVARCHAR(30),
    @Bonus          DECIMAL(12,2) = 0,
    @OtherDeductions DECIMAL(12,2) = 0,
    @Status         NVARCHAR(20) = 'generated'
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @Name NVARCHAR(150), @Dept NVARCHAR(100), @Base DECIMAL(12,2);
    DECLARE @HRA DECIMAL(12,2), @Gross DECIMAL(12,2), @Tax DECIMAL(12,2), @PF DECIMAL(12,2);

    SELECT @Name = full_name, @Dept = department, @Base = base_salary
    FROM dbo.Employees WHERE email = @EmployeeEmail;

    -- New Calculation as per requested calculateSalary code
    DECLARE @Basic DECIMAL(18,2), @HRA DECIMAL(18,2), @Conveyance DECIMAL(18,2) = 2000;
    DECLARE @Special DECIMAL(18,2), @PF DECIMAL(18,2), @ProfTax DECIMAL(18,2) = 200;
    DECLARE @MonthlyTax DECIMAL(18,2), @AnnualSalary DECIMAL(18,2), @AnnualTax DECIMAL(18,2);

    IF @Base IS NULL BEGIN RAISERROR('Employee not found', 16, 1); RETURN; END

    SET @AnnualSalary = @Base * 12;
    SET @Basic   = @Base * 0.40;
    SET @HRA     = @Basic * 0.50;
    SET @Special = @Base - (@Basic + @HRA + @Conveyance);
    SET @Gross   = @Base + @Bonus;
    
    IF @AnnualSalary > 400000 
        SET @AnnualTax = (400000 * 0.10) + ((@AnnualSalary - 400000) * 0.15);
    ELSE 
        SET @AnnualTax = @AnnualSalary * 0.10;
    
    SET @MonthlyTax = @AnnualTax / 12;
    SET @PF  = @Basic * 0.12;

    INSERT INTO dbo.Payslips (employee_name, employee_email, department, month,
        base_salary, hra, transport_allowance, medical_allowance, special_allowance, bonus, gross_salary,
        tax_deduction, provident_fund, professional_tax, other_deductions, total_deductions, net_salary, status)
    VALUES (@Name, @EmployeeEmail, @Dept, @Month,
        @Basic, @HRA, @Conveyance, 0, @Special, @Bonus, @Gross,
        @MonthlyTax, @PF, @ProfTax, @OtherDeductions, 
        (@MonthlyTax + @PF + @ProfTax + @OtherDeductions),
        (@Gross - (@MonthlyTax + @PF + @ProfTax + @OtherDeductions)), @Status);
END
GO

-- SP 4: Monthly Report
CREATE OR ALTER PROCEDURE sp_MonthlyPayrollReport @Month NVARCHAR(30)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT employee_name AS [Employee], department AS [Department],
        base_salary AS [Base], gross_salary AS [Gross],
        total_deductions AS [Deductions], net_salary AS [Net], status AS [Status]
    FROM dbo.Payslips WHERE month = @Month ORDER BY department, employee_name;

    SELECT COUNT(*) AS Total, SUM(gross_salary) AS TotalGross,
        SUM(total_deductions) AS TotalDeductions, SUM(net_salary) AS TotalNet,
        AVG(net_salary) AS AvgNet
    FROM dbo.Payslips WHERE month = @Month;
END
GO


-- ============================================================
-- Views
-- ============================================================
CREATE OR ALTER VIEW vw_ActiveEmployees AS
SELECT id, full_name, email, phone, department, designation,
    date_of_joining, base_salary, leave_balance, status
FROM dbo.Employees WHERE status = 'active';
GO

CREATE OR ALTER VIEW vw_PendingLeaves AS
SELECT id, employee_name, employee_email, department,
    leave_type, start_date, end_date, days, reason, created_date
FROM dbo.LeaveApplications WHERE status = 'pending';
GO

CREATE OR ALTER VIEW vw_DepartmentSalaryBudget AS
SELECT department, COUNT(*) AS EmployeeCount,
    SUM(base_salary) AS TotalBudget, AVG(base_salary) AS AvgSalary,
    MIN(base_salary) AS MinSalary, MAX(base_salary) AS MaxSalary
FROM dbo.Employees WHERE status = 'active' GROUP BY department;
GO

CREATE OR ALTER VIEW vw_MonthlyAttendance AS
SELECT employee_name, employee_email, department,
    COUNT(CASE WHEN status = 'present' THEN 1 END)  AS PresentDays,
    COUNT(CASE WHEN status = 'absent' THEN 1 END)   AS AbsentDays,
    COUNT(CASE WHEN status = 'half_day' THEN 1 END) AS HalfDays,
    SUM(ISNULL(worked_hours, 0))    AS TotalWorkedHours,
    SUM(ISNULL(overtime_hours, 0))  AS TotalOvertimeHours
FROM dbo.Attendance
WHERE MONTH(date) = MONTH(GETDATE()) AND YEAR(date) = YEAR(GETDATE())
GROUP BY employee_name, employee_email, department;
GO


-- ============================================================
-- Triggers
-- ============================================================
CREATE OR ALTER TRIGGER trg_Employees_UpdateDate ON dbo.Employees AFTER UPDATE AS
BEGIN SET NOCOUNT ON; UPDATE dbo.Employees SET updated_date = GETDATE() WHERE id IN (SELECT id FROM inserted); END
GO

CREATE OR ALTER TRIGGER trg_Users_UpdateDate ON dbo.Users AFTER UPDATE AS
BEGIN SET NOCOUNT ON; UPDATE dbo.Users SET updated_date = GETDATE() WHERE id IN (SELECT id FROM inserted); END
GO


-- ============================================================
-- VERIFICATION
-- ============================================================
PRINT '';
PRINT '============================================================';
PRINT '  PayrollPro Database Setup Complete!';
PRINT '============================================================';
PRINT '';

SELECT 'Users'             AS [Table], COUNT(*) AS [Records] FROM dbo.Users
UNION ALL SELECT 'Departments',       COUNT(*) FROM dbo.Departments
UNION ALL SELECT 'Employees',         COUNT(*) FROM dbo.Employees
UNION ALL SELECT 'LeaveApplications', COUNT(*) FROM dbo.LeaveApplications
UNION ALL SELECT 'Payslips',          COUNT(*) FROM dbo.Payslips
UNION ALL SELECT 'SalaryApprovals',   COUNT(*) FROM dbo.SalaryApprovals
UNION ALL SELECT 'Attendance',        COUNT(*) FROM dbo.Attendance;
GO

PRINT '';
PRINT '  Login Credentials:';
PRINT '  -------------------------------------------';
PRINT '  Admin:     admin@payrollpro.com / admin123';
PRINT '  Employee:  rahul.sharma@payrollpro.com / emp123';
PRINT '  (All 69 employees use password: emp123)';
PRINT '  -------------------------------------------';
PRINT '';
PRINT '  Quick Test:';
PRINT '  EXEC sp_GetAdminDashboard;';
PRINT '  EXEC sp_GetEmployeeDashboard ''rahul.sharma@payrollpro.com'';';
PRINT '  EXEC sp_GeneratePayslip ''rahul.sharma@payrollpro.com'', ''March 2026'';';
PRINT '  EXEC sp_MonthlyPayrollReport ''February 2026'';';
PRINT '  SELECT * FROM vw_ActiveEmployees;';
PRINT '  SELECT * FROM vw_DepartmentSalaryBudget;';
GO
