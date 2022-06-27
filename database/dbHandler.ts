export class dbHandlerClass {
    /*  Class handles connection to a database and returns rows */
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
            // throw err;
            // console.log(err.stack)    
            return [{}];
            })        
    }
}

module.exports = dbHandlerClass