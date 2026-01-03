const axios = require('axios');

// Test to check if the user ID from the error exists
async function testUserExists() {
  console.log('Testing if user ID from error exists...\n');
  
  const baseUrl = 'http://localhost:5501';
  const invalidUserId = '6937ecc3b223be6d2be4e669'; // From error messages
  const validUserId = '693fac63f5a66f6eec0683e6'; // Known valid user ID
  
  try {
    // Test with invalid user ID
    console.log(`Testing with INVALID user ID: ${invalidUserId}`);
    const invalidResponse = await axios.get(`${baseUrl}/api/properties/user/${invalidUserId}`);
    console.log('✓ Request succeeded (unexpected)');
    console.log('  Status:', invalidResponse.status);
    console.log('  Data length:', Array.isArray(invalidResponse.data) ? invalidResponse.data.length : 'Not an array');
  } catch (error) {
    console.log('❌ Request failed as expected');
    if (error.response) {
      console.log('  Status:', error.response.status);
      console.log('  Data:', error.response.data);
    }
  }
  
  console.log('');
  
  try {
    // Test with valid user ID
    console.log(`Testing with VALID user ID: ${validUserId}`);
    const validResponse = await axios.get(`${baseUrl}/api/properties/user/${validUserId}`);
    console.log('✓ Request succeeded');
    console.log('  Status:', validResponse.status);
    console.log('  Data length:', Array.isArray(validResponse.data) ? validResponse.data.length : 'Not an array');
  } catch (error) {
    console.log('❌ Request failed');
    if (error.response) {
      console.log('  Status:', error.response.status);
      console.log('  Data:', error.response.data);
    }
  }
}

testUserExists();