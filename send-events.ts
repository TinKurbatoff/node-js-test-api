import { messages } from './messages'
import axios from 'axios'

async function main() {
    for (let i = 0; i < messages.length; i++) {
        const message = messages[i]
        let endpoint = 'shipment'
        if (message.type === 'ORGANIZATION') {
            endpoint = 'organization'
        }

        try {
            let response = await axios.post(`http://localhost:3000/${endpoint}`, message)
            console.error(response.data)
        } catch (error) {
            console.error(error.code)
        }

    }
}

main()