import axios from 'axios';

const API_BASE_URL = 'http://localhost:4000/api';
const API_KEY = 'test-api-key';
const CLIENT_ID = 'default-client';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
        'X-Client-ID': CLIENT_ID,
    },
});

async function testAPI() {
    try {
        console.log('Testing API endpoints...\n');

        // Test health endpoint
        console.log('1. Testing health endpoint...');
        const health = await axios.get('http://localhost:4000/health');
        console.log('Health:', health.data);

        // Test event stats
        console.log('\n2. Testing event stats...');
        const eventStats = await apiClient.get('/events/stats/summary');
        console.log('Event Stats:', eventStats.data);

        // Test delivery stats
        console.log('\n3. Testing delivery stats...');
        const deliveryStats = await apiClient.get('/deliveries/stats/summary');
        console.log('Delivery Stats:', deliveryStats.data);

        // Test events list
        console.log('\n4. Testing events list...');
        const events = await apiClient.get('/events?limit=5');
        console.log('Events:', events.data);

        // Test deliveries list
        console.log('\n5. Testing deliveries list...');
        const deliveries = await apiClient.get('/deliveries?limit=5');
        console.log('Deliveries:', deliveries.data);

        console.log('\n✅ All tests passed!');
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        console.error('Status:', error.response?.status);
        console.error('Headers:', error.response?.headers);
    }
}

testAPI();