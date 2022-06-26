//import { stringify } from "querystring";
const pool = require("./database/connect")
const dbHandlerClass = require('./database/dbHandler')

export class Shipment {
    id: string;
    type: string = "SHIPMENT"
    referenceId: string;
    organizations: Array<string>;
    transportPacks: Object;
    estimatedTimeArrival: Date;
    conn: any;

    constructor(conn: any) {
        this.conn = conn;
        }

    public async createShipment(shipmentInfo: any): Promise<string> {
        // Shipment data request example
        // {
        //   type: 'SHIPMENT',
        //   referenceId: 'S00001175',
        //   organizations: [ 'SEA', 'BOG', 'FMT' ],
        //   transportPacks: { nodes: [ [Object] ] }
        // }        
        let queryPool = dbHandlerClass.queryPool;  // Static method to query DB
        console.log(`type:${shipmentInfo.type}`);
        this.referenceId = shipmentInfo.referenceId;
        this.estimatedTimeArrival = shipmentInfo.estimatedTimeArrival;
        console.log(`referenceId:${this.referenceId}`);
        var queryString:string = `INSERT INTO shipments (referenceId, estimatedTimeArrival) 
                                    VALUES ($1, $2) 
                                    ON CONFLICT (referenceId) 
                                    DO UPDATE SET estimatedTimeArrival = $2
                                    RETURNING *;`

        var result = await queryPool(this.conn, queryString, [this.referenceId, this.estimatedTimeArrival])
        this.id = result[0].id  // First row only
        console.log(`🔥🔥 this.id = ${this.id}`);     
        // console.log(shipmentInfo.organizations);
        // console.log(`Organizations: ${shipmentInfo.organizations.length}`);
        // console.log(`Nodes: ${shipmentInfo.transportPacks.nodes.length}`);
       
        // ——— Parse organizations
        shipmentInfo.organizations.forEach( async (org: string) => {
            console.log(org);
            // Find related organization
            queryString = `SELECT id, code
                           FROM organizations
                           WHERE code = $1;`
            
            let ifOrg = await queryPool(this.conn, queryString, [org])
            // clear all connected organizations
            queryString = `DELETE FROM shipments_organizations WHERE shipment_id = $1;`
            await queryPool(this.conn, queryString, [this.id])
            // Add new                
            if (ifOrg.length !== 0) {
                let organizationId = ifOrg[0].id
                var queryString = `INSERT INTO shipments_organizations (shipment_id, organization_id) \
                                        VALUES ($1, $2) \
                                        ON CONFLICT (shipment_id, organization_id) DO NOTHING;`
                await queryPool(this.conn, queryString, [this.id, organizationId])
                }
            }) 

        // ———— Parse packs
        queryString = `DELETE FROM transportPacks WHERE shipment_id = $1;`
        await queryPool(this.conn, queryString, [this.id])
        // Add new info about packs
        shipmentInfo.transportPacks.nodes.forEach( async (pack: any) => {
            console.log(pack.totalWeight);
            let queryString = `INSERT INTO transportPacks (shipment_id, weight, unit) 
                                        VALUES ($1, $2, $3);`
            // console.log(`🎱 shipmentId:${this.id}`)
            await queryPool(this.conn, queryString, [this.id, pack.totalWeight.weight, pack.totalWeight.unit])
            })
        return this.id; 
    }

    public async findShipment(shipmentId: string): Promise<any> {
        let queryPool = dbHandlerClass.queryPool;  // Static method to query DB
        // Joined request
        // let queryString = `SELECT \ 
        //                     sh.id \
        //                     , referenceid\
        //                     , estimatedTimeArrival\
        //                     , tr_p.weight\
        //                     , tr_p.unit\
        //                     , org.code\
        //                     , org.uuid\
        //                     -- COUNT(tr_p.shipment_id) AS packs,
        //                     -- COUNT(org.code) AS organizations
        //                 FROM shipments AS sh                        
        //                 JOIN shipments_organizations AS sh_or ON sh_or.shipment_id = sh.id
        //                 JOIN organizations AS org ON org.id = sh_or.organization_id
        //                 JOIN transportPacks AS tr_p ON tr_p.shipment_id = sh.id
        //                 WHERE sh.referenceId = $1
        //                 GROUP BY (sh.id, org.id, sh_or.shipment_id, sh_or.organization_id, tr_p.id)
        //                 ORDER BY COUNT(org.id);`
        // console.log(`🎱 shipmentId:${this.id}`)
        let queryStringSp = `SELECT  
                                id
                            ,   referenceID
                            ,   estimatedTimeArrival
                            FROM shipments AS sh                        
                            WHERE sh.referenceId = $1;`

        let queryStringTp = `SELECT  
                                tr_p.weight
                            ,   tr_p.unit
                            FROM shipments AS sh                        
                            INNER JOIN transportPacks AS tr_p ON tr_p.shipment_id = sh.id
                            WHERE sh.referenceId = $1
                            ORDER BY tr_p.id;`

        let queryStringOrgs = `SELECT  
                                org.code
                            FROM shipments AS sh                        
                            INNER JOIN shipments_organizations AS sh_or ON sh_or.shipment_id = sh.id
                            INNER JOIN organizations AS org ON org.id = sh_or.organization_id
                            WHERE sh.referenceId = $1
                            ORDER BY org.id;`
        let queries = [queryStringSp, queryStringTp, queryStringOrgs]
        var shipmentInfo = new Array()
        // queries.forEach(async (queryString: string) => {  // Parallel queries — will not use 
        console.log("———— GET FULL SHIPMENT INFO ———")
        for (let queryString of queries) {
            var shipmentInfo1 = await queryPool(this.conn, queryString, [shipmentId]);
            // console.log(shipmentInfo1);
            shipmentInfo.push(shipmentInfo1);
            }
        // console.log(shipmentInfo)  // ** Sanity check ***
        let parsedShipmentInfo = {};
        if (shipmentInfo[0].length > 0 ) {        
            // There is a record — Parse it!
            this.id = shipmentInfo[0][0].id;
            this.referenceId = shipmentInfo[0][0].referenceid;
            this.transportPacks = {'nodes': shipmentInfo[1]}
            this.estimatedTimeArrival = shipmentInfo[0][0].estimatedtimearrival;
            // Shipment data response example
            // {
            //   type: 'SHIPMENT',
            //   referenceId: 'S00001175',
            //   organizations: [ 'SEA', 'BOG', 'FMT' ],
            //   transportPacks: { nodes: [ [Object] ] }
            // }        

            parsedShipmentInfo = { 'type': this.type,
                                    'referenceId': this.referenceId,
                                    'transportPacks': this.transportPacks,
                                    'estimatedTimeArrival': this.estimatedTimeArrival
                                }
            }
        return parsedShipmentInfo; 
        }
}

export class Organization {
    type = "ORGANIZATION"
    id: string;
    uuid: string;
    code: string;
    pool: any;

    constructor(pool: any) {
        this.pool = pool;
        }

    public async createOrganization(organizationInfo: {id: string, code: string}): Promise<any> {    
        let queryPool = dbHandlerClass.queryPool;  // Static method to query DB
        console.log(organizationInfo)
        const {id, code } = organizationInfo
        let upsertString: string = `INSERT INTO organizations (uuid, code) \
                                    VALUES ($1, $2) \
                                    ON CONFLICT (uuid) \
                                    DO UPDATE SET code = $2 \
                                    RETURNING *;`
        return await queryPool(this.pool, upsertString, [id, code])
        }

    public async getOrganization(uuid: string, code: string): Promise<any> {    
        let queryPool = dbHandlerClass.queryPool;  // Static method to query DB
        // console.log(uuid)  // *** Sanity check ***
        let upsertString: string = `SELECT 
                                    *
                                    FROM organizations
                                    WHERE (uuid = $1) OR (code = $2);`
        let organizationInfo = await queryPool(this.pool, upsertString, [uuid, code])
        let parsedOrganizationInfo = {};
        if (organizationInfo.length > 0 ) {        
            // There is a record — Parse it!
            this.id = organizationInfo[0].id
            this.uuid = organizationInfo[0].uuid
            this.code = organizationInfo[0].code
            // Organization data response example
            // {
            //     "type": "ORGANIZATION",
            //     "id": "381f5cc5-dfe4-4f58-98ad-116666855ca3",
            //     "code": "SEA"
            //   }
            parsedOrganizationInfo = { 'type': this.type,
                                    'id': this.uuid,
                                    'code': this.code,
                                    }
            }
        return parsedOrganizationInfo; 
        }
    
}    

export class TransportPack {
    id: string
    weight: number
    unit: string
    pool: any;

    constructor(pool: any) {
        this.pool = pool;
        }

    static async getAllUnits(dbConnector:any) {
        /* Iterate over conversion rates table to find all available units */
        let queryString = `SELECT unit_from as all_units FROM unitConversions UNION (SELECT unit_to FROM unitConversions);`
        let result = await dbHandlerClass.queryPool(dbConnector, queryString, [])        
        return result.map((obj:any) => obj.all_units)
        }
    
    static async convertUnits(dbConnector:any, unitFrom: string, unitTo:string): Promise<number> {
        /* Finds a proper weight units conversion rate and returns an exact rate */
        if (unitFrom == unitTo) { return 1 } // Same unit
        // Okay look into the table at the both sides of equation...
        let queryString = `SELECT * FROM unitConversions 
                            WHERE unit_from IN ($1, $2) AND unit_to IN ($1, $2);`
        let conversionRate = await dbHandlerClass.queryPool(dbConnector, queryString, [unitFrom, unitTo])        
        // console.log(conversionRate) // *** Sanity Check ***
        if (conversionRate.length == 0) { return 0 } // Not found!
        
        // Direct conversion from->to
        else if (conversionRate[0].unit_from == unitFrom) {
            return conversionRate[0].rate}
        
        // Reverse conversion from<-to
        else {
            return (1 / conversionRate[0].rate)}
    }
    
    static async getAllPacks(dbConnector:any, limit: number = 10) {
        /* Locates all packs */
        let queryString = `SELECT * FROM transportPacks 
                            LIMIT $1;`
        return await dbHandlerClass.queryPool(dbConnector, queryString, [limit])        
        }
    
    public async getAllPacksWeight(units: string, limit: number = 100) {
        let allPacks = await TransportPack.getAllPacks(this.pool, limit)
        var totalWeight = 0
        if (allPacks.length != 0) {
            // console.log(allPacks) // *** Sanity check *** 
            
            // Prepare records and find full scope of units
            let allUnitsFound = [...new Set(allPacks.map((obj:any) => obj.unit))].map((obj:string) => obj) // Only unique units, then cast values to string
            // console.log(typeof allUnitsFound)  // ** Sanity check ***
            
            // Prepare conversion table
            var conversionTable: { [key: string]: number } = {}; // Conversion table for all founded packs
            for (var myUnit of allUnitsFound) {
                conversionTable[myUnit] = await TransportPack.convertUnits(this.pool, myUnit, units)}
            // console.log(conversionTable) // ** Sanity check ***

            // Iterate over all weights and caclulate total weight
            let allWeightsArray = allPacks.map((obj:any) => [obj.weight, obj.unit]) // Collect only weights
            // console.log(allWeightsArray) // ** Sanity check ***
            for (const [weight, unit] of allWeightsArray) {
                // Iterate over all packs, add to total converting on the fly...
                totalWeight += (weight * (conversionTable as any)[unit])
                }
            }
        return `${totalWeight.toFixed(2)} ${units}`  // limit two decimals
        }
}