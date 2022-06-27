var dbHandlerClass = require('../database/dbHandler')

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
            // Clear all connected organizations
            queryString = `DELETE FROM shipments_organizations WHERE shipment_id = $1;`
            await queryPool(this.conn, queryString, [this.id])
            // Add a new m2m field               
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

module.exports = Shipment