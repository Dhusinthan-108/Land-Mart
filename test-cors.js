const axios = require('axios');

async function testCors() {
    try {
        // Test user data
        const userData = {
            name: 'CORSTest User',
            email: 'cors-test@example.com',
            password: 'testpassword123',
            role: 'buyer',
            phone: '1234567890'
        };

        console.log('Testing CORS-enabled registration endpoint...');
        
        // Test with Origin header to simulate browser request
        const response = await axios.post('http://localhost:5500/api/users', userData, {
            headers: {
                'Origin': 'http://localhost:5500',
                'Content-Type': 'application/json'
            }
        });
        
        console.log('CORS test successful!');
        console.log('Response status:', response.status);
        console.log('Response data:', response.data);
        
        // Check for CORS headers
        console.log('CORS headers in response:');
        for (const [key, value] of Object.entries(response.headers)) {
            if (key.toLowerCase().includes('access-control')) {
                console.log(`  ${key}: ${value}`);
            }
        }
        
    } catch (error) {
        console.error('CORS test failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response headers:', error.response.headers);
        }
    }
}

testCors();