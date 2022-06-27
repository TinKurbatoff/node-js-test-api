// User modules
const dbHandlerClass = require('./dbHandler')

export class SeedAllTables {
    /* This class creates database from scratch */
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
            console.log(`🗄 🗂  ...Executing action: ${key}...`)
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

module.exports = SeedAllTables;