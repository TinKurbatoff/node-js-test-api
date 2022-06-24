const express = require('express')
const bodyParser = require("body-parser");
var pg = require("pg");

import { FileLogger } from "typeorm";
// Importing the class that builds model of datatbase
import { creteAllTables } from "./model";

const app = express()  // Okay use `express` web server... Why not Koa? Lighter and with proper async support
app.use(bodyParser.json());
const port = 3000
const DATABASE = "logixboard_api"

console.log(`🐌🐌🐌🦌   Connecting to database ${DATABASE}...`)
var client = new pg.Client({
  user: "logixboard",
  password: "logixboard!2000",
  database: DATABASE,
  port: 5432,
  host: "localhost",
  ssl: false,
});

  
// Creating our DB model (if not exists)
client.connect();
let createTables = new creteAllTables(client);
// client.disconnect();

app.post('/shipment', async (req: any, res: any) => {
  // console.log(req.body);
  res.status(200).json({ result: 'OK', endpoint: '/shipment' })
})

app.post('/organization', (req: any, res: any) => {
  const { id, code } = req.body
  //'INSERT INTO organizations (uuid, code) VALUES ($1, $2) RETURNING *'
  let upsertString: string = `INSERT INTO organizations (uuid, code) \
                                VALUES ($1, $2) \
                                ON CONFLICT (uuid) \
                                DO UPDATE SET code = $2 \
                                RETURNING *;`
  client.query(upsertString, [id, code],
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

app.listen(port, () => {
  console.log(`❤️ Logixboard listening at http://localhost:${port}`)
})
