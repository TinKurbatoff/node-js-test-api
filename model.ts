import { stringify } from "querystring";

/*  Class handles connection to a database and returns rows */
export class dbHandlerClass {
    static async queryPool(conn: any, queryString:string, params: any) {
        return conn.query(queryString, params)
        .then( (res: any) => {
            // console.log(res.command)
            // console.debug(`📬  Executed action ${queryString} OKAY.`)
            return res.rows;
            })
        .catch((err: { message: any; }) => {
            console.log(err.message)
            console.log(`⛔️  Query failed: ${queryString}`)
            throw err;
            // console.log(err.stack)    
            })        
    }
}

export class creteAllTables {
    conn: any;
    tablesSQL: Object = {
    // Create Create/Update timestamps
    "Create Function": `CREATE OR REPLACE FUNCTION trigger_set_timestamp()
                        RETURNS TRIGGER AS $$
                        BEGIN
                            NEW.updated_at = NOW();
                            RETURN NEW;
                        END;
                        $$ LANGUAGE plpgsql;`,

    // Clear DataBase
    // "01.Drop shipments": 'DROP TABLE IF EXISTS shipments CASCADE;',
    // "02.Drop transportPacks": 'DROP TABLE IF EXISTS transportPacks;',
    // "03.Drop organizations": 'DROP TABLE IF EXISTS organizations CASCADE;',
    // "04.Drop shipments_organizations": 'DROP TABLE IF EXISTS shipments_organizations;',
    // "05.Drop unitConversions": 'DROP TABLE IF EXISTS unitConversions;',
    // Shipments 
    "06.Create shipments": 'CREATE TABLE IF NOT EXISTS shipments (\
        id SERIAL PRIMARY KEY \
        , created_at TIMESTAMPTZ NOT NULL DEFAULT NOW() \
        , updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW() \
        , referenceId VARCHAR(100) not null \
        , estimatedTimeArrival TIMESTAMP\
        , CONSTRAINT referenceId_unique UNIQUE (referenceId) );',
    "06. Triger for update": `CREATE OR REPLACE TRIGGER set_timestamp
        BEFORE UPDATE ON shipments
        FOR EACH ROW
        EXECUTE PROCEDURE trigger_set_timestamp();`,
    // All packs 
    "07.Create transportPacks": 'CREATE TABLE IF NOT EXISTS transportPacks (\
                id SERIAL PRIMARY KEY \
                , created_at TIMESTAMPTZ NOT NULL DEFAULT NOW() \
                , updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW() \
                , shipment_id INTEGER NOT NULL REFERENCES shipments (id) \
                , weight INTEGER \
                , unit VARCHAR(100) NOT NULL);',
    "07. Triger for update": `CREATE OR REPLACE TRIGGER set_timestamp
    BEFORE UPDATE ON transportPacks
    FOR EACH ROW
    EXECUTE PROCEDURE trigger_set_timestamp();`,
    // Organizations   
    "08.Create organizations": 'CREATE TABLE IF NOT EXISTS organizations (\
                id SERIAL PRIMARY KEY \
                , created_at TIMESTAMPTZ NOT NULL DEFAULT NOW() \
                , updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW() \
                , uuid VARCHAR(100) \
                , code VARCHAR(100)\
                , CONSTRAINT uuid_unique UNIQUE (uuid) );',
    "08. Triger for update": `CREATE OR REPLACE TRIGGER set_timestamp
                BEFORE UPDATE ON organizations
                FOR EACH ROW
                EXECUTE PROCEDURE trigger_set_timestamp();`,
    // Many 2 Many table              
    "09.Create shipments_organizations": 'CREATE TABLE IF NOT EXISTS shipments_organizations (\
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW() \
            , updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW() \
            , shipment_id    INTEGER REFERENCES shipments (id) ON UPDATE CASCADE ON DELETE CASCADE\
            , organization_id INTEGER REFERENCES organizations (id) ON UPDATE CASCADE\
            , CONSTRAINT shipments_organizations_pkey PRIMARY KEY (shipment_id, organization_id) );',
    "09. Triger for update": `CREATE OR REPLACE TRIGGER set_timestamp
            BEFORE UPDATE ON shipments_organizations
            FOR EACH ROW
            EXECUTE PROCEDURE trigger_set_timestamp();`,
    "10.Create unitConversions": 'CREATE TABLE IF NOT EXISTS unitConversions (\
          unit_from VARCHAR(100) NOT NULL \
        , unit_to VARCHAR(100) NOT NULL \
        , rate NUMERIC(9, 5) NOT NULL\
        , CONSTRAINT unitConversions_pkey PRIMARY KEY (unit_from, unit_to) );',        
    }
    
    // Units converter table
    unitsSQL = {
        "unitConversionsRates": "INSERT INTO unitConversions (unit_from, unit_to, rate) VALUES ($1, $2, $3) \
                         ON CONFLICT (unit_from, unit_to) DO NOTHING;"
        }
    
    unitsRates: Object = {
        "Kilograms-pounds": ["KILOGRAMS", "POUNDS", 2.20462],
        "Kilograms-onces":  ["KILOGRAMS", "OUNCES", 35.27396],
        "Kilograms-grams": ["KILOGRAMS", "GRAMS", 1000],
        "Pounds-onces":  ["POUNDS", "OUNCES", 16],
        "Pounds-grams": ["POUNDS", "GRAMS", 453.59237],
        "Onces-grams":  ["OUNCES", "GRAMS", 28.34952],
        }
    
    // Set connection 
    constructor(pool: any) {
        this.conn = pool 
        }

    public async createTables() {
        // this.tablesSQL.forEach(async (queryString: string, key: string, map: any) => {
        let queryPool = dbHandlerClass.queryPool;  // Static method to query DB
        for (const [key, queryString] of Object.entries(this.tablesSQL)) {
            console.log(`📦  ...Executing action: ${key}...`)
            await queryPool(this.conn, queryString, [])
            console.log(`✅  Executed action ${key} OKAY.`)
            }
        // Populate Unit conversion table
        const queryString = this.unitsSQL['unitConversionsRates']
        for (const [key, value] of Object.entries(this.unitsRates)) {        
            console.log(`⚖️  Populate conversion table with: ${key}...`)
            await queryPool(this.conn, queryString, value)
            }
        }
}


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

    
    
    public static async convertUnits(dbConnector:any, unitFrom: string, unitTo:string) {
        // Find proper conversion rate
        let queryPool = dbHandlerClass.queryPool;  // Static method to query DB
        let queryString: string = `SELECT * FROM unitConversions
                                    WHERE unit_from IN ($1, $2) AND unit_to IN ($1, $2);`
        let conversionRate = await queryPool(dbConnector, queryString, [unitFrom, unitTo])        
        console.log(conversionRate)
        if (conversionRate.length == 0) { return 0 }
        // Direct conversion from->to
        else if (conversionRate[0].unit_from == unitFrom) {return conversionRate[0].rate}
        // Reverse conversion from<-to
        else {return (1 / conversionRate[0].rate).toFixed(6)}
        }
    
    public async getAllPacks() {

        }
    
    public async getAllPacksWeight(units: string) {
        let totalWeight = 50000 
        let fromUnits = "OUNCES"
        let rate = await TransportPack.convertUnits(this.pool, fromUnits, units)
        console.log(`conversion rate:${rate}`)
        let converted = (totalWeight * rate).toFixed(2)
        return `${converted} ${units}` 
        }
}