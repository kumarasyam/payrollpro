const { getPool } = require('./server/db.cjs');

getPool().then(pool => pool.request().query("SELECT OBJECT_DEFINITION(OBJECT_ID('sp_GeneratePayslip')) AS def"))
  .then(res => console.log(res.recordset[0].def))
  .catch(console.error)
  .finally(() => process.exit(0));
