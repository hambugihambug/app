const axios = require('axios');

// Define server URLs to test (both remote and local)
const servers = [
    { name: 'Remote Server', url: 'http://10.32.31.235:3000' },
    { name: 'Local Server', url: 'http://localhost:3000' },
];

// Test endpoints
const endpoints = ['/api/health', '/api/floors', '/api/floors/1'];

async function testApiConnections() {
    console.log('API Connection Test Results:');
    console.log('===========================');

    for (const server of servers) {
        console.log(`\nTesting ${server.name} (${server.url}):`);

        for (const endpoint of endpoints) {
            const url = `${server.url}${endpoint}`;
            try {
                console.log(`\n[REQUEST] ${url}`);
                const startTime = Date.now();
                const response = await axios.get(url, { timeout: 5000 });
                const endTime = Date.now();

                console.log(`[SUCCESS] Status: ${response.status} (${endTime - startTime}ms)`);

                // Print a sample of the response data (truncated for readability)
                const data = JSON.stringify(response.data).substring(0, 300);
                console.log(`[RESPONSE] ${data}${data.length >= 300 ? '...' : ''}`);
            } catch (error) {
                console.log(`[ERROR] ${error.message}`);
                if (error.response) {
                    console.log(
                        `[ERROR DETAILS] Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`
                    );
                }
            }
        }
    }
}

// Run the tests
testApiConnections();
