/**
 * SQL Server Database Connection
 * Uses Windows Authentication by default (same as your SSMS login)
 */
const sql = require('mssql');
require('dotenv').config();

const config = {
    server: process.env.DB_SERVER || 'localhost\\SQLEXPRESS',
    database: process.env.DB_NAME || 'PayrollProDB',
    options: {
        trustServerCertificate: true,  // Required for local dev
        trustedConnection: true,       // Windows Authentication
        enableArithAbort: true,
    },
    // If using SQL Server Authentication instead, uncomment:
    // user: process.env.DB_USER || 'sa',
    // password: process.env.DB_PASSWORD || 'your_password',
    driver: 'msnodesqlv8',  // Needed for Windows Auth
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
