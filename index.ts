import { dir } from "console";

// import CommonJS modules
const bodyParser = require("body-parser");
var express = require('express')

// Routes
const indexRouter = require('./routes/routes');
const organizationRouter = require('./routes/routes');
const shipmentRouter = require('./routes/routes');
const packsRouter = require('./routes/routes');

/* ————————— EXPRESS WEB SERVER ———————————— */
const app = express()  // Okay use `express` web server... 
const port = 3000  // Port from environment in production

// Connect to Database
const pool = require("./database/connect")  

// Creating our DB model (if not exists) — SEED DATABASE
// Initilize DB settings
const SeedAllTables = require('./database/seedDb');
const seedTablesClass = new SeedAllTables(pool)
seedTablesClass.createTables(); // Create all tables

/* ———— BODY PARSERS ———————— */
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true,}))  // may *not* be used, but I would keep it

/* ————————————————————— ENDPOINTS ——————————————————————— */
app.use('/', indexRouter);
app.use('/organization/', organizationRouter);
app.use('/shipment/', shipmentRouter);
app.use('/packs/', packsRouter);


// // Error handling middleware that Express will call in the event of malformed JSON.
// app.use(function(err: { message: any; }, req: Request, res: Response, next: (arg0: any) => void) {
//   // 'SyntaxError: Unexpected token n in JSON at position 0'
//   console.log(err.message);
//   next(err);
// });

app.listen(port, () => {
  console.log(`❤️ Logixboard is listening at http://localhost:${port} with love!`)
})
