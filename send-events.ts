import { messages } from './messages'
import axios from 'axios'
import dotenv from 'dotenv';

dotenv.config();

async function main() {
    for (let i = 0; i < messages.length; i++) {
        const message = messages[i]
        let endpoint = 'shipment'
        if (message.type === 'ORGANIZATION') {
            endpoint = 'organization'
        }

        try {
            let response = await axios.post(`http://localhost:${process.env.APP_PORT}/${endpoint}`, message)
            console.error(response.data)
        } catch (error) {
            console.error(error.code)
        }

    }
}

main()