const { getPool } = require('./server/db.cjs');

getPool().then(pool => pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Attendance'"))
  .then(res => console.log(res.recordset))
  .catch(console.error)
  .finally(() => process.exit(0));
