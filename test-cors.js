const axios = require('axios');

// Test CORS configuration and endpoints
async function testEndpoints() {
  console.log('Testing CORS configuration and API endpoints...\n');
  
  const baseUrl = 'http://localhost:5501';
  const testUserId = '693fac63f5a66f6eec0683e6'; // Valid user ID from your database
  
  try {
    // Test 1: OPTIONS request to properties endpoint (CORS preflight)
    console.log('Test 1: CORS Preflight Request');
    const optionsResponse = await axios.options(`${baseUrl}/api/properties/user/${testUserId}`, {
      headers: {
        'Origin': 'http://127.0.0.1:5501',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    
    console.log('✓ OPTIONS request successful');
    console.log('  Status:', optionsResponse.status);
    console.log('  Access-Control-Allow-Origin:', optionsResponse.headers['access-control-allow-origin']);
    console.log('  Access-Control-Allow-Methods:', optionsResponse.headers['access-control-allow-methods']);
    console.log('  Access-Control-Allow-Headers:', optionsResponse.headers['access-control-allow-headers']);
    
    // Test 2: GET request to user properties endpoint
    console.log('\nTest 2: GET User Properties');
    const getResponse = await axios.get(`${baseUrl}/api/properties/user/${testUserId}`, {
      headers: {
        'Origin': 'http://127.0.0.1:5501'
      }
    });
    
    console.log('✓ GET request successful');
    console.log('  Status:', getResponse.status);
    console.log('  Content-Type:', getResponse.headers['content-type']);
    console.log('  Access-Control-Allow-Origin:', getResponse.headers['access-control-allow-origin']);
    console.log('  Data length:', Array.isArray(getResponse.data) ? getResponse.data.length : 'Not an array');
    
    // Test 3: GET request to saved properties endpoint
    console.log('\nTest 3: GET Saved Properties');
    const savedResponse = await axios.get(`${baseUrl}/api/properties/saved/${testUserId}`, {
      headers: {
        'Origin': 'http://127.0.0.1:5501'
      }
    });
    
    console.log('✓ GET saved properties request successful');
    console.log('  Status:', savedResponse.status);
    console.log('  Content-Type:', savedResponse.headers['content-type']);
    console.log('  Access-Control-Allow-Origin:', savedResponse.headers['access-control-allow-origin']);
    console.log('  Data length:', Array.isArray(savedResponse.data) ? savedResponse.data.length : 'Not an array');
    
  } catch (error) {
    console.error('❌ Test failed:');
    if (error.response) {
      console.error('  Status:', error.response.status);
      console.error('  Headers:', error.response.headers);
      console.error('  Data:', error.response.data);
    } else {
      console.error('  Error:', error.message);
    }
  }
}

testEndpoints();