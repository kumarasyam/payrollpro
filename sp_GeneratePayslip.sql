
-- SP 3: Generate Payslip
CREATE   PROCEDURE sp_GeneratePayslip
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

    IF @Base IS NULL BEGIN RAISERROR('Employee not found', 16, 1); RETURN; END

    SET @HRA   = ROUND(@Base * 0.10, 2);
    SET @Gross = @Base + @HRA + 200 + 150 + @Bonus;
    SET @Tax   = ROUND(@Gross * 0.10, 2);
    SET @PF    = ROUND(@Base * 0.12, 2);

    INSERT INTO dbo.Payslips (employee_name, employee_email, department, month,
        base_salary, hra, transport_allowance, medical_allowance, bonus, gross_salary,
        tax_deduction, provident_fund, other_deductions, total_deductions, net_salary, status)
    VALUES (@Name, @EmployeeEmail, @Dept, @Month,
        @Base, @HRA, 200, 150, @Bonus, @Gross,
        @Tax, @PF, @OtherDeductions, @Tax + @PF + @OtherDeductions,
        @Gross - @Tax - @PF - @OtherDeductions, @Status);
END
