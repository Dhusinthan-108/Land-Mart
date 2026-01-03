# Frontend-Backend Integration Fix

This document identifies and resolves the integration issues between the frontend and backend of the Land Mart application.

## Issues Identified

### 1. CORS Configuration Issues
The CORS configuration in `server.js` allows multiple origins including `localhost:3000` and `localhost:5500`. This can cause conflicts when the frontend and backend are both running on port 5500.

### 2. API Endpoint Mismatches
Some API calls in the frontend may not be hitting the correct endpoints due to inconsistent URL construction.

### 3. Request Method and Header Issues
Some API calls might be missing proper headers or using incorrect HTTP methods.

### 4. User ID Validation
Some API endpoints may not be properly validating user IDs, leading to empty responses.

## Solutions Implemented

### 1. Fixed CORS Configuration

Updated `server.js` to have a cleaner CORS configuration:

```javascript
// In server.js
const corsOptions = {
  origin: ['http://localhost:5500', 'http://127.0.0.1:5500'],
  optionsSuccessStatus: 200,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
};
```

### 2. Enhanced API Call Debugging

Added comprehensive debugging to all API calls in `main.js`:

```javascript
// Enhanced fetch calls with better error handling
async function loadMyProperties() {
  try {
    // Get current user from localStorage
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
      console.log('No user logged in');
      document.getElementById('my-properties-container').innerHTML = '<p>You must be logged in to view your properties. <a href="login.html">Log in</a></p>';
      return;
    }
    
    console.log('Loading properties for user:', currentUser);
    
    // Determine the correct API base URL
    const apiBaseUrl = getApiBaseUrl();
    const url = `${apiBaseUrl}/api/properties/user/${currentUser.id}`;
    
    console.log('Fetching user properties from:', url);
    
    // Fetch user's properties
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const properties = await response.json();
    console.log('Received properties:', properties);
    
    // Rest of the function...
  } catch (error) {
    console.error('Error loading user properties:', error);
    const container = document.getElementById('my-properties-container');
    if (container) {
      container.innerHTML = `<p>Error loading properties: ${error.message}. Please try again later.</p>`;
    }
  }
}
```

### 3. Improved Error Handling and Validation

Enhanced all API calls with better validation and error handling:

```javascript
// Validate user ID before making API calls
function isValidUserId(userId) {
  // Simple validation - in a real app, you might want more robust validation
  return userId && typeof userId === 'string' && userId.length > 0;
}

// Example usage in loadMessages function
async function loadMessages() {
  try {
    // Get current user from localStorage
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
      console.log('No user logged in');
      return;
    }
    
    // Validate user ID
    if (!isValidUserId(currentUser.id)) {
      console.error('Invalid user ID:', currentUser.id);
      return;
    }
    
    // Get the messages container
    const container = document.getElementById('messages-container');
    if (!container) return;
    
    // Determine the correct API base URL
    const apiBaseUrl = getApiBaseUrl();
    const url = `${apiBaseUrl}/api/messages/conversation/${currentUser.id}`;
    
    console.log('Fetching messages from:', url);
    
    // Fetch messages for the current user
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Messages response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`Failed to load messages. Status: ${response.status}`);
    }
    
    const messages = await response.json();
    console.log('Received messages:', messages);
    
    // Rest of the function...
  } catch (error) {
    console.error('Error loading messages:', error);
    const container = document.getElementById('messages-container');
    if (container) {
      container.innerHTML = `<p>Error loading messages: ${error.message}. Please try again later.</p>`;
    }
  }
}
```

### 4. Enhanced Backend Request Logging

Added detailed logging middleware to the backend to help debug requests:

```javascript
// In server.js, add this middleware for debugging
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log('\n=== INCOMING REQUEST ===');
    console.log(`Method: ${req.method}`);
    console.log(`URL: ${req.url}`);
    console.log(`Headers:`, req.headers);
    
    if (req.query && Object.keys(req.query).length > 0) {
      console.log(`Query Params:`, req.query);
    }
    
    if (req.body && Object.keys(req.body).length > 0) {
      console.log(`Body:`, req.body);
    }
    
    console.log('========================\n');
    next();
  });
}
```

### 5. Fixed Dashboard Data Loading

Improved the dashboard data loading to ensure proper synchronization:

```javascript
// Enhanced loadUnifiedDashboard function
async function loadUnifiedDashboard() {
  try {
    // Get current user from localStorage
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
      console.log('No user logged in');
      return;
    }
    
    console.log('Loading dashboard for user:', currentUser);
    
    // Update user info immediately
    const userNameElement = document.getElementById('user-name');
    const userRoleElement = document.getElementById('user-role');
    
    if (userNameElement) userNameElement.textContent = currentUser.name;
    if (userRoleElement) userRoleElement.textContent = currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1);
    
    // Determine the correct API base URL
    const apiBaseUrl = getApiBaseUrl();
    
    // Fetch user's properties with better error handling
    try {
      const propertiesResponse = await fetch(`${apiBaseUrl}/api/properties/user/${currentUser.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (propertiesResponse.ok) {
        const properties = await propertiesResponse.json();
        console.log('User properties:', properties);
        
        // Update dashboard stats
        const totalPropertiesElement = document.getElementById('total-properties');
        if (totalPropertiesElement) {
          totalPropertiesElement.textContent = properties.length;
        }
        
        // Count pending approvals
        const pendingApprovals = properties.filter(prop => prop.status === 'pending_approval').length;
        const pendingApprovalsElement = document.getElementById('pending-approvals');
        if (pendingApprovalsElement) {
          pendingApprovalsElement.textContent = pendingApprovals;
        }
      } else {
        console.error('Failed to fetch user properties. Status:', propertiesResponse.status);
      }
    } catch (propertiesError) {
      console.error('Error fetching user properties:', propertiesError);
    }
    
    // Update saved properties count
    updateSavedPropertiesCount();
    
    console.log(`Loaded dashboard for user ${currentUser.name}`);
  } catch (error) {
    console.error('Error loading unified dashboard:', error);
    showNotification('Error loading dashboard: ' + error.message, false);
  }
}
```

## Testing the Fixes

### 1. Verify Server is Running
Ensure the Node.js server is running on port 5500:
```bash
node server.js
```

### 2. Check API Endpoints
Test the API endpoints using curl or Postman:
```bash
# Test properties endpoint
curl -X GET http://localhost:5500/api/properties

# Test user properties endpoint
curl -X GET http://localhost:5500/api/properties/user/USER_ID

# Test messages endpoint
curl -X GET http://localhost:5500/api/messages/conversation/USER_ID
```

### 3. Monitor Console Logs
Open the browser's developer tools and monitor the console for:
- Network requests to API endpoints
- Error messages
- Successful data loading

### 4. Verify Data Display
Check that:
- Dashboard statistics are populated correctly
- Property lists load properly
- Messages display in the messages tab
- Saved properties show up in the saved properties tab

## Common Issues and Solutions

### Issue: "Failed to load resource: net::ERR_CONNECTION_REFUSED"
**Solution**: Ensure the Node.js server is running on port 5500

### Issue: CORS errors in browser console
**Solution**: Verify the CORS configuration in `server.js` matches the frontend origin

### Issue: Empty data in dashboard
**Solution**: Check that the user is properly logged in and that user IDs are valid

### Issue: API calls returning 404 errors
**Solution**: Verify that API endpoints in the frontend match those defined in the backend routes

## Verification Checklist

- [ ] Server running on port 5500
- [ ] CORS properly configured
- [ ] API endpoints accessible
- [ ] User authentication working
- [ ] Dashboard data loading correctly
- [ ] Messages displaying properly
- [ ] Property lists populating
- [ ] Saved properties showing
- [ ] Error handling in place
- [ ] Console logs showing successful operations

This fix should resolve the frontend-backend integration issues and ensure stable, clean communication between the two.