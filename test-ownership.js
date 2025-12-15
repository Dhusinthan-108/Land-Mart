const axios = require('axios');

async function testOwnership() {
    try {
        // Create a test user
        console.log('Creating test user...');
        const userResponse = await axios.post('http://localhost:5500/api/users', {
            name: 'Test Owner',
            email: 'owner@test.com',
            password: 'testpass123',
            role: 'seller',
            phone: '1234567890'
        });
        
        const userId = userResponse.data._id;
        console.log(`Created user with ID: ${userId}`);
        
        // Create a property for this user
        console.log('Creating property for user...');
        const propertyResponse = await axios.post('http://localhost:5500/api/properties', {
            title: 'My Test Property',
            description: 'A beautiful property owned by Test Owner',
            price: 200000,
            size: 10,
            location: 'Test Location',
            terrain: 'flat',
            ownerId: userId
        });
        
        console.log(`Created property: ${propertyResponse.data.title}`);
        
        // Create another user
        console.log('Creating second user...');
        const user2Response = await axios.post('http://localhost:5500/api/users', {
            name: 'Another User',
            email: 'another@test.com',
            password: 'testpass456',
            role: 'buyer',
            phone: '0987654321'
        });
        
        const user2Id = user2Response.data._id;
        console.log(`Created second user with ID: ${user2Id}`);
        
        // Create a property for the second user
        console.log('Creating property for second user...');
        const property2Response = await axios.post('http://localhost:5500/api/properties', {
            title: 'Another Property',
            description: 'A property owned by Another User',
            price: 150000,
            size: 5,
            location: 'Another Location',
            terrain: 'hilly',
            ownerId: user2Id
        });
        
        console.log(`Created property: ${property2Response.data.title}`);
        
        // Test getting properties for specific user
        console.log('Testing user-specific property retrieval...');
        const userProperties = await axios.get(`http://localhost:5500/api/properties/user/${userId}`);
        console.log(`User ${userId} has ${userProperties.data.length} properties:`);
        userProperties.data.forEach(prop => {
            console.log(`  - ${prop.title}`);
        });
        
        const user2Properties = await axios.get(`http://localhost:5500/api/properties/user/${user2Id}`);
        console.log(`User ${user2Id} has ${user2Properties.data.length} properties:`);
        user2Properties.data.forEach(prop => {
            console.log(`  - ${prop.title}`);
        });
        
        // Test getting all properties
        console.log('Getting all properties...');
        const allProperties = await axios.get('http://localhost:5500/api/properties');
        console.log(`Total properties in system: ${allProperties.data.length}`);
        
        console.log('Ownership test completed successfully!');
        
    } catch (error) {
        console.error('Error in ownership test:', error.message);
    }
}

testOwnership();