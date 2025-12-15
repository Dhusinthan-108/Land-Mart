const axios = require('axios');

async function testRegistration() {
    try {
        // Test user data
        const userData = {
            name: 'John Doe',
            email: 'johndoe@example.com',
            password: 'securepassword123',
            role: 'buyer',
            phone: '+1234567890'
        };

        console.log('Testing user registration...');
        console.log('Sending data:', userData);

        // Send registration request
        const response = await axios.post('http://localhost:5500/api/users', userData);
        
        console.log('Registration successful!');
        console.log('Response:', response.data);
        
        // Test duplicate registration (should fail)
        console.log('\nTesting duplicate registration (should fail)...');
        try {
            const duplicateResponse = await axios.post('http://localhost:5500/api/users', userData);
            console.log('Unexpected success on duplicate registration:', duplicateResponse.data);
        } catch (error) {
            if (error.response && error.response.status === 409) {
                console.log('Correctly rejected duplicate registration:', error.response.data.message);
            } else {
                console.log('Unexpected error:', error.message);
            }
        }
        
        // Retrieve all users to confirm
        console.log('\nRetrieving all users...');
        const usersResponse = await axios.get('http://localhost:5500/api/users');
        console.log(`Total users in database: ${usersResponse.data.length}`);
        console.log('All users:', JSON.stringify(usersResponse.data, null, 2));
        
    } catch (error) {
        console.error('Registration test failed:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

testRegistration();