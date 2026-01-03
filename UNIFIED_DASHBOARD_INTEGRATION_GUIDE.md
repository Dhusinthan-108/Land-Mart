# Unified Dashboard Integration Guide

This guide explains how to properly integrate the frontend unified dashboard with the backend APIs.

## 1. Architecture Overview

The Land Mart application follows a client-server architecture:
- **Frontend**: Static HTML/CSS/JavaScript served via Live Server on port 5500
- **Backend**: Node.js/Express server running on port 5500
- **Database**: MongoDB for data persistence

## 2. API Base URL Configuration

All frontend API calls should use the consistent base URL:
```
http://localhost:5500
```

The `getApiBaseUrl()` utility function in `main.js` ensures this consistency:
```javascript
function getApiBaseUrl() {
    return 'http://localhost:5500';
}
```

## 3. CORS Configuration

The backend server is configured to accept requests from:
- `http://localhost:5500`
- `http://127.0.0.1:5500`

This allows the frontend to communicate with the backend without CORS issues.

## 4. Authentication Flow

1. User logs in via the login form
2. Backend validates credentials and returns user data
3. Frontend stores user data in `localStorage` as `currentUser`
4. All subsequent API calls can access the current user ID via:
   ```javascript
   const currentUser = JSON.parse(localStorage.getItem('currentUser'));
   const userId = currentUser.id;
   ```

## 5. API Endpoints

### Properties
- `GET /api/properties` - Get all properties
- `GET /api/properties/user/:userId` - Get properties owned by user
- `GET /api/properties/saved/:userId` - Get properties saved by user
- `POST /api/properties` - Create new property
- `POST /api/properties/save` - Save a property
- `POST /api/properties/unsave` - Unsave a property
- `DELETE /api/properties/:id` - Delete a property

### Users
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - Login user
- `GET /api/users/:id` - Get user details
- `PUT /api/users/:id` - Update user details

### Messages
- `GET /api/messages/conversation/:userId` - Get user's conversations
- `GET /api/messages/:conversationId` - Get messages in a conversation
- `POST /api/messages` - Send a new message

## 6. Troubleshooting Common Issues

### Issue: "Cannot read properties of null" Errors
**Cause**: Trying to access DOM elements that don't exist
**Solution**: Always check if elements exist before accessing them:
```javascript
const element = document.getElementById('some-element');
if (element) {
    // Safe to use element
}
```

### Issue: CSS Not Loading
**Cause**: Incorrect CSS file path
**Solution**: Ensure the link tag points to the correct path:
```html
<link rel="stylesheet" href="styles/main.css">
```

### Issue: API Calls Failing
**Cause**: Incorrect API base URL or CORS issues
**Solution**: 
1. Use the `getApiBaseUrl()` function for all API calls
2. Verify the server is running on port 5500
3. Check browser console for CORS errors

### Issue: Data Not Displaying
**Cause**: Asynchronous operations not handled properly
**Solution**: Use async/await for API calls:
```javascript
async function loadData() {
    try {
        const response = await fetch(`${getApiBaseUrl()}/api/data`);
        const data = await response.json();
        // Process data
    } catch (error) {
        console.error('Error loading data:', error);
    }
}
```

## 7. Testing Integration

Run the test script to verify integration:
```bash
node test-unified-dashboard.js
```

This will check:
- API accessibility
- Frontend file availability
- Database connectivity

## 8. Best Practices

1. **Consistent API URLs**: Always use `getApiBaseUrl()` for API calls
2. **Error Handling**: Wrap all API calls in try/catch blocks
3. **User Authentication**: Check for `currentUser` before making user-specific calls
4. **DOM Safety**: Always verify elements exist before manipulating them
5. **Responsive Design**: Test on different screen sizes
6. **Performance**: Implement loading states for async operations

## 9. File Structure

```
land-mart/
├── client/
│   ├── index.html
│   ├── unified-dashboard.html
│   ├── styles/
│   │   └── main.css
│   └── js/
│       └── main.js
├── routes/
│   ├── properties.js
│   ├── users.js
│   └── messages.js
├── controllers/
├── models/
└── server.js
```

## 10. Deployment Notes

For production deployment:
1. Update API base URL to production server
2. Configure proper CORS settings
3. Set up environment variables for database connections
4. Implement proper error logging
5. Add security measures (rate limiting, input validation, etc.)

---

This guide should help resolve most integration issues between the frontend unified dashboard and backend APIs. If problems persist, check the browser console for specific error messages and verify that all services are running correctly.