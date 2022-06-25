const bodyParser = require("body-parser");
const express = require('express')
const pg = require("pg");

import { FileLogger } from "typeorm";
// Importing the class that builds model of datatbase
import { creteAllTables, Shipment, Organization } from "./model";

const app = express()  // Okay use `express` web server... Why not Koa? Lighter and with proper async support
const port = 3000
const DATABASE = "logixboard_api"

app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  }))

console.log(`🐌🐌🐌🦌   Connecting to database ${DATABASE}...`)
// var client = new pg.Client({  // ** Disabled **
const pool = new pg.Pool({ // Let use Pooling now
  // In production I will use environment variables
  user: "logixboard", 
  password: "logixboard!2000",
  database: DATABASE,
  port: 5432,
  host: "localhost",
  ssl: false,
});

// the pool with emit an error on behalf of any idle clients
// it contains if a backend error or network partition happens
pool.on('error', (err: any, client: any) => {
  console.error('Unexpected error on idle client', err) // your callback here
  process.exit(-1)
})
 
pool.connect()
// Creating our DB model (if not exists)
// client.connect();
let createTables = new creteAllTables();
createTables.createTables(pool);
// client.disconnect();


// Just presents itself
app.get('/', (req: any, res: { json: (arg0: { info: string; }) => void; }) => {
  res.json({ info: 'Node.js, Express, and Postgres API for shipments' })
})

app.post('/shipment', async (req: any, res: any) => {
    let shipment = new Shipment();
    let updateResult = await shipment.createShipment(req.body, pool);
    console.log(`Updated field id:${updateResult} `);
    console.log(`———— REQUEST HANDLED OK BYE! BYE! ———— `);
    res.status(200).json({ result: 'OK', endpoint: '/shipment' });
})

app.post('/organization', (req: any, res: any) => {
  const { id, code } = req.body
  //'INSERT INTO organizations (uuid, code) VALUES ($1, $2) RETURNING *'
  let upsertString: string = `INSERT INTO organizations (uuid, code) \
                                VALUES ($1, $2) \
                                ON CONFLICT (uuid) \
                                DO UPDATE SET code = $2 \
                                RETURNING *;`
  pool.query(upsertString, [id, code],
        (error: any, results: { rows: { id: any; }[]; }) => {
          if (error) {
            throw error
            }
          // console.log(results);
          let resultString: string = `Organization added/updated with ID: ${results.rows[0].id}` 
          console.log(resultString);
          res.status(201).send(resultString);
        })  
  // console.log(req.body);
  // res.status(200).json({ result: 'OK', endpoint: '/organization' })
})

app.get('/shipments/', (req: any, res: any) => {
  // console.log(req.body);
  console.log(`shipmentId:${req.params.shipmentId}`)
  res.status(404).json({ result: 'FAIL', message: 'shipmentID is empty', endpoint: '/shipments/:shipmentId' })
})


app.get('/shipments/:shipmentId', (req: any, res: any) => {
  // console.log(req.body);
  console.log(`shipmentId:${req.params.shipmentId}`)
  res.status(200).json({ result: 'OK', endpoint: '/shipments/:shipmentId' })
})

app.get('/organizations/', (req: any, res: any) => {
  // console.log(req.body);
  console.log(`organizationId:${req.params.shipmentId}`)
  res.status(404).json({ result: 'FAIL', message: 'organizationId is empty', endpoint: '/organizations/:organizationId' })
})

app.get('/organizations/:organizationId', (req: any, res: any) => {
  // console.log(req.body);
  res.status(200).json({ result: 'OK', endpoint: '/organizations/:organizationId'  })
})

// Error handling middleware that Express will call in the event of malformed JSON.
app.use(function(err: { message: any; }, req: any, res: any, next: (arg0: any) => void) {
  // 'SyntaxError: Unexpected token n in JSON at position 0'
  console.log(err.message);
  next(err);
});

app.listen(port, () => {
  console.log(`❤️ Logixboard listening at http://localhost:${port}`)
})
