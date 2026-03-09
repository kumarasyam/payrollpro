/**
 * PayrollPro Backend API Server
 * Connects React frontend to SQL Server database
 */
const express = require('express');
const cors = require('cors');
const { sql, getPool } = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// ============================================================
// Helper: Run a query and return results
// ============================================================
async function query(sqlText, params = {}) {
    const pool = await getPool();
    const request = pool.request();
    for (const [key, value] of Object.entries(params)) {
        request.input(key, value);
    }
    return request.query(sqlText);
}


// ============================================================
// AUTH ROUTES
// ============================================================

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await query(
            'SELECT id, email, full_name, role FROM dbo.Users WHERE email = @email AND password_hash = @password AND is_active = 1',
            { email, password }
        );
        if (result.recordset.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        res.json(result.recordset[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password, full_name, role = 'employee' } = req.body;
        // Check if exists
        const existing = await query('SELECT id FROM dbo.Users WHERE email = @email', { email });
        if (existing.recordset.length > 0) {
            return res.status(400).json({ error: 'A user with this email already exists' });
        }
        const result = await query(
            'INSERT INTO dbo.Users (email, password_hash, full_name, role) OUTPUT INSERTED.* VALUES (@email, @password, @full_name, @role)',
            { email, password, full_name, role }
        );
        const user = result.recordset[0];

        // If the user registered as an employee, also insert them into the Employees table
        if (role === 'employee') {
            await query(
                `INSERT INTO dbo.Employees (full_name, email, department, designation, base_salary, status) 
                 VALUES (@full_name, @email, 'Unassigned', 'New Joiner', 0, 'active')`,
                { full_name, email }
            );
        }
        res.json({ id: user.id, email: user.email, full_name: user.full_name, role: user.role });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// ============================================================
// GENERIC CRUD HELPER
// ============================================================
function createCrudRoutes(tableName, entityName) {

    // GET /api/{entity} — list all
    app.get(`/api/${entityName}`, async (req, res) => {
        try {
            const result = await query(`SELECT * FROM dbo.${tableName} ORDER BY id DESC`);
            res.json(result.recordset);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // GET /api/{entity}/filter?key=value — filter
    app.get(`/api/${entityName}/filter`, async (req, res) => {
        try {
            const filters = req.query;
            let whereClause = '';
            const params = {};
            const conditions = [];

            Object.entries(filters).forEach(([key, value], i) => {
                // Skip sort parameter
                if (key === '_sort') return;
                conditions.push(`${key} = @p${i}`);
                params[`p${i}`] = value;
            });

            if (conditions.length > 0) {
                whereClause = 'WHERE ' + conditions.join(' AND ');
            }

            const sortField = filters._sort || 'id';
            const sortDir = sortField.startsWith('-') ? 'DESC' : 'ASC';
            const cleanSort = sortField.replace(/^-/, '');

            const result = await query(
                `SELECT * FROM dbo.${tableName} ${whereClause} ORDER BY ${cleanSort} ${sortDir}`,
                params
            );
            res.json(result.recordset);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // POST /api/{entity} — create
    app.post(`/api/${entityName}`, async (req, res) => {
        try {
            const data = req.body;
            const columns = Object.keys(data);
            const values = columns.map((_, i) => `@p${i}`);
            const params = {};
            columns.forEach((col, i) => {
                params[`p${i}`] = data[col];
            });

            const result = await query(
                `INSERT INTO dbo.${tableName} (${columns.join(', ')}) OUTPUT INSERTED.* VALUES (${values.join(', ')})`,
                params
            );
            res.json(result.recordset[0]);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // PUT /api/{entity}/:id — update
    app.put(`/api/${entityName}/:id`, async (req, res) => {
        try {
            const { id } = req.params;
            const data = req.body;
            const setClauses = [];
            const params = { id: parseInt(id) };

            Object.entries(data).forEach(([key, value], i) => {
                if (key === 'id') return; // Don't update ID
                setClauses.push(`${key} = @p${i}`);
                params[`p${i}`] = value;
            });

            if (setClauses.length === 0) {
                return res.status(400).json({ error: 'No fields to update' });
            }

            const result = await query(
                `UPDATE dbo.${tableName} SET ${setClauses.join(', ')}, updated_date = GETDATE() WHERE id = @id; SELECT * FROM dbo.${tableName} WHERE id = @id;`,
                params
            );
            res.json(result.recordset[0]);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // DELETE /api/{entity}/:id — delete
    app.delete(`/api/${entityName}/:id`, async (req, res) => {
        try {
            const { id } = req.params;
            await query(`DELETE FROM dbo.${tableName} WHERE id = @id`, { id: parseInt(id) });
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
}

// Register CRUD routes for all entities
createCrudRoutes('Employees', 'employees');
createCrudRoutes('Departments', 'departments');
createCrudRoutes('LeaveApplications', 'leaves');
createCrudRoutes('Payslips', 'payslips');
createCrudRoutes('SalaryApprovals', 'salary-approvals');
createCrudRoutes('Attendance', 'attendance');


// ============================================================
// SPECIAL ROUTES
// ============================================================

// GET /api/dashboard/admin — admin dashboard stats
app.get('/api/dashboard/admin', async (req, res) => {
    try {
        const result = await query(`
      SELECT
        (SELECT COUNT(*) FROM dbo.Employees WHERE status = 'active')              AS totalEmployees,
        (SELECT COUNT(*) FROM dbo.Departments)                                     AS totalDepartments,
        (SELECT COUNT(*) FROM dbo.LeaveApplications WHERE status = 'pending')      AS pendingLeaves,
        (SELECT COUNT(*) FROM dbo.SalaryApprovals WHERE status = 'pending')        AS pendingSalaryApprovals,
        (SELECT COUNT(*) FROM dbo.Payslips)                                        AS totalPayslips,
        (SELECT ISNULL(SUM(base_salary), 0) FROM dbo.Employees WHERE status = 'active') AS monthlyPayroll
    `);
        res.json(result.recordset[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/payslips/generate — generate payslip using stored procedure
app.post('/api/payslips/generate', async (req, res) => {
    try {
        const { employeeEmail, month, bonus = 0, otherDeductions = 0 } = req.body;
        const pool = await getPool();
        const request = pool.request();
        request.input('EmployeeEmail', employeeEmail);
        request.input('Month', month);
        request.input('Bonus', bonus);
        request.input('OtherDeductions', otherDeductions);
        await request.execute('sp_GeneratePayslip');
        res.json({ success: true, message: `Payslip generated for ${month}` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/reports/salary — salary report
app.get('/api/reports/salary', async (req, res) => {
    try {
        const month = req.query.month || 'February 2026';
        const result = await query(
            `SELECT employee_name, department, base_salary, gross_salary, total_deductions, net_salary, status
       FROM dbo.Payslips WHERE month = @month ORDER BY department, employee_name`,
            { month }
        );
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/reports/department — department-wise budget
app.get('/api/reports/department', async (req, res) => {
    try {
        const result = await query('SELECT * FROM vw_DepartmentSalaryBudget');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// ============================================================
// START SERVER
// ============================================================
app.listen(PORT, async () => {
    console.log('');
    console.log('============================================');
    console.log(`  PayrollPro API Server running on port ${PORT}`);
    console.log('============================================');
    console.log('');
    try {
        await getPool();
        console.log('  Database: Connected to PayrollProDB');
        console.log(`  API URL:  http://localhost:${PORT}/api`);
        console.log('');
        console.log('  Available endpoints:');
        console.log('    POST /api/auth/login');
        console.log('    POST /api/auth/register');
        console.log('    GET  /api/employees');
        console.log('    GET  /api/departments');
        console.log('    GET  /api/leaves');
        console.log('    GET  /api/payslips');
        console.log('    GET  /api/salary-approvals');
        console.log('    GET  /api/attendance');
        console.log('    GET  /api/dashboard/admin');
        console.log('    GET  /api/reports/salary');
        console.log('    GET  /api/reports/department');
        console.log('');
    } catch (err) {
        console.error('  WARNING: Could not connect to database');
        console.error('  Server is running but API calls will fail');
        console.log('');
    }
});
