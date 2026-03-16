const { getPool } = require('./server/db.cjs');

async function updatePolicyAndBalances() {
    console.log("Updating Leave Policy in database...");
    const pool = await getPool();
    
    try {
        // 1. Update the LeavePolicy table
        // We set sick: 4, casual: 10, earned: 10, total: 24
        // Paternity stays 15 (as seen in DB) or 60 (as in hardcoded)? Let's check user's previous request. 
        // User said "sick leave to 4 daya max and casual 10,earned leaves 10 total 24 days".
        await pool.request().query("UPDATE dbo.LeavePolicy SET max_sick = 4, max_casual = 10, max_earned = 10 WHERE id = 1");
        console.log("LeavePolicy record updated (ID: 1)");

        // 2. Synchronize employee balances (Standard total 24)
        console.log("Starting leave balance synchronization for all employees...");
        
        // Get all employees
        const employeesRes = await pool.request().query("SELECT id, email, full_name, leave_balance FROM dbo.Employees");
        const employees = employeesRes.recordset;
        
        // Get all approved leave applications
        const leavesRes = await pool.request().query("SELECT employee_email, days FROM dbo.LeaveApplications WHERE status = 'approved'");
        const approvedLeaves = leavesRes.recordset;
        
        console.log(`Found ${employees.length} employees and ${approvedLeaves.length} approved leave records.`);
        
        for (const emp of employees) {
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
            } else {
                // To be safe, let's log current state even if no update needed, so user sees we checked.
                 console.log(`Skipping ${emp.full_name}: Already has ${correctBalance} days`);
            }
        }
        
        console.log("Update and synchronization complete.");
    } catch (err) {
        console.error("Error during update:", err);
    } finally {
        process.exit(0);
    }
}

updatePolicyAndBalances();
