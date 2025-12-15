const axios = require('axios');

async function testLogin() {
    try {
        // Test login data
        const loginData = {
            email: 'johndoe@example.com',
            password: 'securepassword123'
        };

        console.log('Testing user login...');
        console.log('Sending data:', loginData);

        // Send login request
        const response = await axios.post('http://localhost:5500/api/users/login', loginData);
        
        console.log('Login successful!');
        console.log('Response:', response.data);
        
        // Test invalid login (wrong password)
        console.log('\nTesting invalid login (wrong password)...');
        try {
            const invalidResponse = await axios.post('http://localhost:5500/api/users/login', {
                email: 'johndoe@example.com',
                password: 'wrongpassword'
            });
            console.log('Unexpected success on invalid login:', invalidResponse.data);
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Correctly rejected invalid login:', error.response.data.message);
            } else {
                console.log('Unexpected error:', error.message);
            }
        }
        
        // Test invalid login (non-existent user)
        console.log('\nTesting invalid login (non-existent user)...');
        try {
            const invalidResponse = await axios.post('http://localhost:5500/api/users/login', {
                email: 'nonexistent@example.com',
                password: 'anypassword'
            });
            console.log('Unexpected success on invalid login:', invalidResponse.data);
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Correctly rejected non-existent user login:', error.response.data.message);
            } else {
                console.log('Unexpected error:', error.message);
            }
        }
        
    } catch (error) {
        console.error('Login test failed:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

testLogin();