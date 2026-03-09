/**
 * SQL Server Database Connection
 * Uses Windows Authentication by default (same as your SSMS login)
 */
const sql = require('mssql/msnodesqlv8');
require('dotenv').config();

const serverName = process.env.DB_SERVER || 'localhost\\SQLEXPRESS';
const dbName = process.env.DB_NAME || 'PayrollProDB';

const config = {
    // We use a raw connection string so that Windows can automatically 
    // connect via Shared Memory/Named Pipes instead of strict TCP/IP.
    connectionString: `Driver={SQL Server};Server=${serverName};Database=${dbName};Trusted_Connection=yes;`
};

let pool;

async function getPool() {
    if (!pool) {
        try {
            pool = await sql.connect(config);
            console.log('Connected to SQL Server: PayrollProDB');
        } catch (err) {
            console.error('Database connection failed:', err.message);
            console.log('');
            console.log('TROUBLESHOOTING:');
            console.log('1. Make sure SQL Server is running');
            console.log('2. Check your server name in SSMS (e.g. localhost\\SQLEXPRESS)');
            console.log('3. Make sure PayrollProDB database exists');
            console.log('4. Update the .env file with correct settings');
            throw err;
        }
    }
    return pool;
}

module.exports = { sql, getPool };
