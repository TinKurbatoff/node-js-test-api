// Import types
import { Request, Response } from "express";

// Importing the class that builds model of database (both ways are supported since NodeJS V13+)
const pool = require('../database/connect')

// Data Controllers
// import { Shipment, Organization, TransportPack } from "../";
var Shipment = require('../controllers/shipments');
var Organization = require('../controllers/organizations');
var TransportPack = require('../controllers/packs');

// API just presents itself (will populate with swagger)
exports.index = async function(req: Request, res: Response) {
    /* Just reply to strangers */
    res.json({ info: 'Node.js, Express, and Postgres API for shipments' })
  }
  

/* ——————————————————————— REQUESTS/RESPONSE VALIDATORS ——————————————————————*/
// '/shipment'
exports.post_shipment = async function(req: Request, res: Response) {
      /* Save new shipment to a database */
      const shipment = new Shipment(pool);
      console.log(req.body)
      if (req.body?.referenceId) {
        let updateResult = await shipment.createShipment(req.body);
        console.log(`Updated field id:${updateResult} `);
        console.log(`———— POST REQUEST HANDLED OK BYE! BYE! ———— `);
        res.status(200).json({ result: 'OK', endpoint: '/shipment' });
      } else {
        res.status(401).json({ result: 'FAIL', message:'No referenceId', endpoint: '/shipment' });
      }
  }
  
// '/organization'
exports.post_organization = async function(req: Request, res: Response) {
    const organization = new Organization(pool);
    // console.log(req.body);
    // res.status(200).json({ result: 'OK', endpoint: '/organization' })
    let results = await organization.createOrganization(req.body)
    let resultString: string = `Organization added/updated with ID: ${results[0].id}` 
    console.log(`🏢 ${resultString}`);
    console.log(`———— POST REQUEST HANDLED OK BYE! BYE! ———— `);
    res.status(201).json({ result: 'OK', message: resultString, endpoint: '/organization' })
  }
  
// '/packs/:units?', 
exports.get_packs = async function(req: any, res: Response) {
    // console.log(req.body);
    const limit = req.query?.limit > 0 ? req.query.limit : 1000
    const unitsSelected = req.params?.units
    let resultMessage:string;
    let httpCode: number = 401
    let result: string = 'FAIL'
    let totalWeight
    let units = ""
    console.log(`units:${unitsSelected}`)
    const allUnits= await TransportPack.getAllUnits(pool) // Get all units available in DB
    if (!allUnits.includes(unitsSelected)) {
      // Failed request — ask for details
      resultMessage = `select units from list:[${allUnits}]`
      
    } else {
      // Find all packs and calculate total weight
      console.log(`📦  Total weight in ${unitsSelected} requested!`)
      let resultInfo = await new TransportPack(pool).getAllPacksWeight(unitsSelected, limit)
      totalWeight = resultInfo.totalWeight
      units = resultInfo.units
      resultMessage = `${totalWeight} ${units}`
      httpCode = 200  
      result = 'OK'
      console.log(`All packs total weight ${resultMessage}`)
    }
    res.status(httpCode).json({ result: result, message: resultMessage, totalWeight: totalWeight, units: units, endpoint: `/packs/:unit?limit=${limit}` })
  }
  
// '/shipment/:shipmentId?',
exports.get_shipment = async function(req: Request, res: Response) {
    // console.log(req.body);
    console.log(`shipmentId:${req.params.shipmentId}`)
    const shipment = new Shipment(pool);
    let searchResult = await shipment.findShipment(req.params?.shipmentId)
    res.status(200).json({ result: 'OK', message: searchResult, endpoint: '/shipment/:shipmentId' })
  }
  

// '/organization/:organizationId?',
exports.get_organization = async function(req: Request, res: Response) {
    // console.log(req.body);
    const organization = new Organization(pool);
    // console.log(req.body);
    // res.status(200).json({ result: 'OK', endpoint: '/organization' })
    console.log(`Requested organization:${req.params?.organizationId}`)
    let searchResult = await organization.getOrganization(req.params?.organizationId, req.params?.organizationId)
    console.log(`Found:${searchResult.id}`)
    res.status(200).json({ result: 'OK', message: searchResult, endpoint: '/organization/:organizationId'  })
  }
