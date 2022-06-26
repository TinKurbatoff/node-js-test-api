const pg = require("pg");

const DATABASE = "logixboard_api"

// var client = new pg.Client({  // ** Disabled **
console.log(`🐌🐌🐌🦌   Connecting to database ${DATABASE}...`)
export const pool = new pg.Pool({ // Let use Pooling now
  // In production I will use environment variables
  user: "logixboard", 
  password: "logixboard!2000",
  database: DATABASE,
  port: 5432,
  host: "localhost",
  ssl: false,
});

// if a backend error or network problem happens
pool.on('error', (err: any, client: any) => {
  console.error('Unexpected error on idle client', err) // just report to console
  process.exit(-1)
}) 

// Connect to pool
pool.connect()
