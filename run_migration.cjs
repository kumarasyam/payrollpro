const { getPool, sql } = require('./server/db.cjs');

async function runMigration() {
    try {
        console.log('Connecting to database...');
        const pool = await getPool();
        
        console.log('Running migration: Expanding document_url and notes...');
        await pool.request().query('ALTER TABLE dbo.LeaveApplications ALTER COLUMN document_url NVARCHAR(MAX) NULL');
        await pool.request().query('ALTER TABLE dbo.Attendance ALTER COLUMN notes NVARCHAR(MAX) NULL');
        
        console.log('Migration completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err.message);
        process.exit(1);
    }
}

runMigration();
