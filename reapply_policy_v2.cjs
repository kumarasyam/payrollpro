const { getPool } = require('./server/db.cjs');

async function updatePolicyAndBalances() {
    console.log("Updating Leave Policy to Casual: 6, Earned: 14...");
    const pool = await getPool();
    
    try {
        // 1. Update the LeavePolicy table
        await pool.request().query("UPDATE dbo.LeavePolicy SET max_sick = 4, max_casual = 6, max_earned = 14 WHERE id = 1");
        console.log("LeavePolicy record updated (ID: 1)");

        // 2. Synchronize employee balances (Standard total 24)
        const employeesRes = await pool.request().query("SELECT id, email, full_name, leave_balance FROM dbo.Employees");
        const employees = employeesRes.recordset;
        
        const leavesRes = await pool.request().query("SELECT employee_email, days FROM dbo.LeaveApplications WHERE status = 'approved'");
        const approvedLeaves = leavesRes.recordset;
        
        console.log(`Syncing ${employees.length} employees...`);
        
        for (const emp of employees) {
            const startingBalance = 24; 
            const totalTaken = approvedLeaves
                .filter(l => l.employee_email === emp.email)
                .reduce((sum, l) => sum + (l.days || 0), 0);
            
            const correctBalance = Math.max(0, startingBalance - totalTaken);
            
            if (emp.leave_balance !== correctBalance) {
                console.log(`Updating ${emp.full_name}: ${emp.leave_balance} -> ${correctBalance}`);
                await pool.request()
                    .input('id', emp.id)
                    .input('balance', correctBalance)
                    .query("UPDATE dbo.Employees SET leave_balance = @balance WHERE id = @id");
            }
        }
        
        console.log("Synchronization complete.");
    } catch (err) {
        console.error("Error:", err);
    } finally {
        process.exit(0);
    }
}

updatePolicyAndBalances();
