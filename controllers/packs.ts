var dbHandlerClass = require('../database/dbHandler')

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
        if (conversionRate.length == 0) { return 0 // Not found!
        
        // Direct conversion from->to
        } else if (conversionRate[0].unit_from == unitFrom) {
            return conversionRate[0].rate
        
        // Reverse conversion from<-to
        } else {
            return (1 / conversionRate[0].rate)
        }
    }
    
    static async getAllPacks(dbConnector:any, limit: number = 10) {
        /* Locates all packs */
        let queryString = `SELECT * FROM transportPacks 
                            LIMIT $1;`
        return await dbHandlerClass.queryPool(dbConnector, queryString, [limit])        
        }
    
    public async getAllPacksWeight(units: string, limit: number = 100) {
        let allPacks = await TransportPack.getAllPacks(this.pool, limit)
        let totalWeight = 0
        if (allPacks.length != 0) {
            // console.log(allPacks) // *** Sanity check *** 
            
            // Prepare records and find full scope of units
            let allUnitsFound = [...new Set(allPacks.map((obj:any) => obj.unit))].map((obj:string) => obj) // Only unique units, then cast values to string
            // console.log(typeof allUnitsFound)  // ** Sanity check ***
            
            // Prepare conversion table
            let conversionTable: { [key: string]: number } = {}; // Conversion table for all founded packs
            for (const myUnit of allUnitsFound) {
                conversionTable[myUnit] = await TransportPack.convertUnits(this.pool, myUnit, units)}
            // console.log(conversionTable) // ** Sanity check ***

            // Iterate over all weights and calculate total weight
            let allWeightsArray = allPacks.map((obj:any) => [obj.weight, obj.unit]) // Collect only weights
            // console.log(allWeightsArray) // ** Sanity check ***
            for (const [weight, unit] of allWeightsArray) {
                // Iterate over all packs, add to total converting on the fly...
                totalWeight += (weight * conversionTable[unit])
                }
            }
        return {totalWeight: totalWeight.toFixed(2), units: units}  // limit two decimals
        }
}

module.exports = TransportPack