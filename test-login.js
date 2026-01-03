const axios = require('axios');

// Test login with sample account
async function testLogin() {
  console.log('Testing login with sample account...\n');
  
  const baseUrl = 'http://localhost:5501';
  
  // Try to log in with sample account
  const loginData = {
    email: 'sample@gmail.com',
    password: 'sample@123' // Correct password from database
  };
  
  try {
    console.log('Attempting to log in with sample@gmail.com...');
    const response = await axios.post(`${baseUrl}/api/users/login`, loginData);
    
    console.log('✓ Login successful!');
    console.log('Response:', response.data);
    
    // Show what the frontend would store in localStorage
    console.log('\nFrontend would store this in localStorage:');
    console.log('==========================================');
    const userData = {
      id: response.data.user.id,
      name: response.data.user.name,
      email: response.data.user.email,
      role: response.data.user.role
    };
    console.log(JSON.stringify(userData, null, 2));
    
    console.log('\nWith this data, the frontend would make requests to:');
    console.log(`GET ${baseUrl}/api/properties/user/${userData.id}`);
    console.log(`GET ${baseUrl}/api/properties/saved/${userData.id}`);
    
  } catch (error) {
    console.log('Login failed:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
    } else {
      console.log('Error:', error.message);
    }
    
    console.log('\nNote: You might need to register a new account if the default password doesn\'t work.');
    console.log('Try registering at http://localhost:5501/register.html');
  }
}

testLogin();