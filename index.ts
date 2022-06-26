const bodyParser = require("body-parser");
const express = require('express')
const pg = require("pg");

import { FileLogger } from "typeorm";
// Importing the class that builds model of datatbase
import { creteAllTables, Shipment, Organization, TransportPack } from "./model";

const app = express()  // Okay use `express` web server... Why not Koa? Lighter and with proper async support
const port = 3000
const DATABASE = "logixboard_api"

app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  }))

// var client = new pg.Client({  // ** Disabled **
console.log(`🐌🐌🐌🦌   Connecting to database ${DATABASE}...`)
const pool = new pg.Pool({ // Let use Pooling now
  // In production I will use environment variables
  user: "logixboard", 
  password: "logixboard!2000",
  database: DATABASE,
  port: 5432,
  host: "localhost",
  ssl: false,
});

// emit an error on behalf of any idle clients
// if a backend error or network partition happens
pool.on('error', (err: any, client: any) => {
  console.error('Unexpected error on idle client', err) // just report to console
  process.exit(-1)
}) 

// Connect
pool.connect()

// Creating our DB model (if not exists)
let createTables = new creteAllTables(pool);
createTables.createTables();

/* ————————————————————— ENDPOINTS ——————————————————————— */
// API just presents itself (will populate with swagger)
app.get('/', (req: any, res: { json: (arg0: { info: string; }) => void; }) => {
  res.json({ info: 'Node.js, Express, and Postgres API for shipments' })
})

app.post('/shipment', async (req: any, res: any) => {
    let shipment = new Shipment(pool);
    console.log(req.body)
    if ('referenceId' in req.body){
      let updateResult = await shipment.createShipment(req.body);
      console.log(`Updated field id:${updateResult} `);
      console.log(`———— REQUEST HANDLED OK BYE! BYE! ———— `);
      res.status(200).json({ result: 'OK', endpoint: '/shipment' });
    } else {
      res.status(401).json({ result: 'FAIL', message:'No referenceId', endpoint: '/shipment' });
    }
})

app.post('/organization', async (req: any, res: any) => {
  const organization = new Organization(pool);
  // console.log(req.body);
  // res.status(200).json({ result: 'OK', endpoint: '/organization' })
  let results = await organization.createOrganization(req.body)
  let resultString: string = `Organization added/updated with ID: ${results[0].id}` 
  console.log(`🏢 ${resultString}`);
  console.log(`———— REQUEST HANDLED OK BYE! BYE! ———— `);
  res.status(201).json({ result: 'OK', message: resultString, endpoint: '/organization' })
})

app.get('/shipments/', (req: any, res: any) => {
  // console.log(req.body);
  console.log(`shipmentId:${req.params.shipmentId}`)
  res.status(404).json({ result: 'FAIL', message: 'shipmentID is empty', endpoint: '/shipments/:shipmentId' })
})


app.get('/shipments/:shipmentId', async (req: any, res: any) => {
  // console.log(req.body);
  console.log(`shipmentId:${req.params.shipmentId}`)
  const shipment = new Shipment(pool);
  let searchResult = await shipment.findShipment(req.params.shipmentId)
  res.status(200).json({ result: 'OK', message: searchResult, endpoint: '/shipments/:shipmentId' })
})

app.get('/organizations/', (req: any, res: any) => {
  // console.log(req.body);
  console.log(`organizationId:${req.params.shipmentId}`)
  res.status(404).json({ result: 'FAIL', message: 'organizationId is empty', endpoint: '/organizations/:organizationId' })
})

app.get('/organizations/:organizationId', async (req: any, res: any) => {
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
  console.log(`❤️ Logixboard is listening at http://localhost:${port} with love!`)
})
