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


app.get('/packs/:unit?', async (req: any, res: any) => {
  // console.log(req.body);
  var limit: number = +req.query.limit || 1000
  let unitsSelected = req.params.unit || "N/A"
  var resultMessage:string;
  console.log(`units:${unitsSelected}`)
  let allUnits= await TransportPack.getAllUnits(pool)
  if (!allUnits.includes(unitsSelected)) {
    // Failed request — ask for details
    resultMessage = `select units from list:[${allUnits}]`
    } 
  else {
    // Find all packs and calculate total weight
    console.log(`📦  Total weight in ${unitsSelected} requested!`)
    resultMessage = await new TransportPack(pool).getAllPacksWeight(unitsSelected, limit)
    }
  console.log(`All packs`)
  res.status(200).json({ result: 'FAIL', message: resultMessage, endpoint: '/packs/:unit' })
})


app.get('/shipments/:shipmentId?', async (req: any, res: any) => {
  // console.log(req.body);
  console.log(`shipmentId:${req.params.shipmentId}`)
  const shipment = new Shipment(pool);
  let searchResult = await shipment.findShipment(req.params.shipmentId)
  res.status(200).json({ result: 'OK', message: searchResult, endpoint: '/shipments/:shipmentId' })
})


app.get('/organizations/:organizationId?', async (req: any, res: any) => {
  // console.log(req.body);
  const organization = new Organization(pool);
  // console.log(req.body);
  // res.status(200).json({ result: 'OK', endpoint: '/organization' })
  let searchResult = await organization.getOrganization(req.params.organizationId, "N/A")

  res.status(200).json({ result: 'OK', message: searchResult, endpoint: '/organizations/:organizationId'  })
})
/*  ——— ENDPOINTS HANDLERS END ————  */ 

// Error handling middleware that Express will call in the event of malformed JSON.
app.use(function(err: { message: any; }, req: any, res: any, next: (arg0: any) => void) {
  // 'SyntaxError: Unexpected token n in JSON at position 0'
  console.log(err.message);
  next(err);
});

app.listen(port, () => {
  console.log(`❤️ Logixboard is listening at http://localhost:${port} with love!`)
})
