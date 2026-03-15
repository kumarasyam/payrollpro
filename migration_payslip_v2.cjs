const { getPool, sql } = require('./server/db.cjs');

async function runMigration() {
    try {
        const pool = await getPool();
        console.log('Adding special_allowance and professional_tax to Payslips...');
        
        await pool.request().query('ALTER TABLE dbo.Payslips ADD special_allowance DECIMAL(12,2) NOT NULL DEFAULT 0');
        await pool.request().query('ALTER TABLE dbo.Payslips ADD professional_tax DECIMAL(12,2) NOT NULL DEFAULT 0');
        
        console.log('Migration completed successfully!');
        process.exit(0);
    } catch (err) {
        if (err.message.includes('already exists')) {
            console.log('Columns already exist, skipped.');
        } else {
            console.error('Migration failed:', err.message);
        }
        process.exit(0);
    }
}

runMigration();
