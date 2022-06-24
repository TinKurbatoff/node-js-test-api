export class creteAllTables {
    constructor(client: any) {
    // client.query('SELECT NOW()', (err: any, res: any): void => {
    //   console.log("SELECT NOW()")
    //   console.log(res.rows)
    //   client.end()
    // })

    let tablesSQL = new Map<string, string>([
    // All packs 
    ["transportPacks", 'CREATE TABLE IF NOT EXISTS transportPacks (\
                id SERIAL PRIMARY KEY \
                , shipment_id INTEGER NOT NULL REFERENCES shipments(id) \
                , weight INTEGER \
                , unit VARCHAR(100) NOT NULL)'],
    // Organizations
    ["organizations", 'CREATE TABLE IF NOT EXISTS organizations (\
                id SERIAL PRIMARY KEY \
                , uuid VARCHAR(100) \
                , code VARCHAR(100)\
                , CONSTRAINT uuid_unique UNIQUE (uuid) )'],
    // Shipments
    ["shipments", 'CREATE TABLE IF NOT EXISTS shipments (\
                id SERIAL PRIMARY KEY \
                , referenceId VARCHAR(100) not null \
                , organizations INTEGER\
                , estimatedTimeArrival DATE)'],
    // Many 2 Many table              
    ["shipments_organizations", 'CREATE TABLE IF NOT EXISTS shipments_organizations (\
                shipment_id    INTEGER REFERENCES shipments (id) ON UPDATE CASCADE ON DELETE CASCADE\
            , organization_id INTEGER REFERENCES organizations (id) ON UPDATE CASCADE)']
    ]); 

    tablesSQL.forEach((queryString: string, key: string) => {
        // console.log(`Query string: ${queryString}`)
        client.query(queryString, (err: { message: any; }, res: { command: string, rows: any[]; }) => {
            console.log(`📦  Creating table: ${key}...`)
            if (err) {
                console.log(err.message)
                console.log(`⛔️  Table ${key} was not created — FAIL.`)
                // console.log(err.stack)
            } else {
                console.log(res.command)
                console.log(`✅  Created table ${key} OKAY.`)
            }
            
            })
        });
    // client.end();
}}

export class aShipment {


    }