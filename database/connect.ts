const pg = require("pg");

// var client = new pg.Client({  // ** Disabled **
console.log(`🐌🐌🐌🦌   Connecting to database ${process.env.DATABASE}...`)
export const pool = new pg.Pool({ // Let use Pooling now
  // In production I will use environment variables
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DATABASE,
  port: process.env.DB_PORT,
  host: process.env.DB_HOST,
  ssl: false,
});

// if a backend error or network problem happens
pool.on('error', (err: any, client: any) => {
  console.error('Unexpected error on idle client', err) // just report to console
  process.exit(-1)
}) 

// Connect to pool
pool.connect()

module.exports = pool