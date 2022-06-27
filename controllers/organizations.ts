var dbHandlerClass = require('../database/dbHandler')

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

module.exports = Organization