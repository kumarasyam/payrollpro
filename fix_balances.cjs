const { getPool } = require('./server/db.cjs');

async function fixBalances() {
    console.log("Starting leave balance synchronization...");
    const pool = await getPool();
    
    try {
        // 1. Get all employees
        const employeesRes = await pool.request().query("SELECT id, email, full_name, leave_balance FROM dbo.Employees");
        const employees = employeesRes.recordset;
        
        // 2. Get all approved leave applications
        const leavesRes = await pool.request().query("SELECT employee_email, days FROM dbo.LeaveApplications WHERE status = 'approved'");
        const approvedLeaves = leavesRes.recordset;
        
        console.log(`Found ${employees.length} employees and ${approvedLeaves.length} approved leave records.`);
        
        for (const emp of employees) {
            // Standard total according to policy is 24 (4 sick + 6 casual + 14 earned)
            const startingBalance = 24; 
            
            // Calculate total days taken (approved only)
            const totalTaken = approvedLeaves
                .filter(l => l.employee_email === emp.email)
                .reduce((sum, l) => sum + (l.days || 0), 0);
            
            const correctBalance = Math.max(0, startingBalance - totalTaken);
            
            if (emp.leave_balance !== correctBalance) {
                console.log(`Updating ${emp.full_name} (${emp.email}): ${emp.leave_balance} -> ${correctBalance}`);
                await pool.request()
                    .input('id', emp.id)
                    .input('balance', correctBalance)
                    .query("UPDATE dbo.Employees SET leave_balance = @balance WHERE id = @id");
            }
        }
        
        console.log("Synchronization complete.");
    } catch (err) {
        console.error("Error during synchronization:", err);
    } finally {
        process.exit(0);
    }
}

fixBalances();
