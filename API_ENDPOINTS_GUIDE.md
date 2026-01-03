# Land Mart API Endpoints Guide

This document provides a comprehensive overview of all available API endpoints, their usage, and testing instructions.

## Base URL
All API endpoints are accessible at: `http://127.0.0.1:5500/api`

## Available Endpoints

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:userId` - Get user by ID
- `POST /api/users/register` - Register a new user
- `POST /api/users/login` - Login user
- `PUT /api/users/:userId` - Update user
- `DELETE /api/users/:userId` - Delete user

### Properties
- `GET /api/properties` - Get all properties
- `GET /api/properties/:propertyId` - Get property by ID
- `GET /api/properties/user/:userId` - Get properties by user ID
- `POST /api/properties` - Create a new property
- `PUT /api/properties/:propertyId` - Update property
- `DELETE /api/properties/:propertyId` - Delete property
- `POST /api/properties/:propertyId/save` - Save a property for a user
- `POST /api/properties/:propertyId/unsave` - Unsave a property for a user
- `GET /api/properties/saved/:userId` - Get saved properties for a user

### Messages
- `GET /api/messages` - Get all messages
- `GET /api/messages/:messageId` - Get message by ID
- `GET /api/messages/conversation/:userId` - Get conversation with a specific user
- `POST /api/messages` - Create a new message
- `PUT /api/messages/:messageId/read` - Mark message as read

### Transactions
- `GET /api/transactions` - Get all transactions (placeholder)
- `GET /api/transactions/:transactionId` - Get transaction by ID (placeholder)
- `POST /api/transactions` - Create a new transaction (placeholder)
- `PUT /api/transactions/:transactionId` - Update transaction (placeholder)
- `DELETE /api/transactions/:transactionId` - Delete transaction (placeholder)

## Sample Data Structures

### User
```json
{
  "_id": "693fac63f5a66f6eec0683e6",
  "name": "John Doe",
  "email": "john@example.com",
  "password": "hashed_password",
  "role": "buyer",
  "phone": "1234567890",
  "bio": "About me",
  "savedProperties": [],
  "isActive": true,
  "createdAt": "2025-12-15T06:00:00.000Z",
  "updatedAt": "2025-12-15T06:00:00.000Z"
}
```

### Property
```json
{
  "_id": "693facc7f5a66f6eec0683ed",
  "title": "Beautiful Countryside Plot",
  "description": "A spacious plot in the countryside perfect for building your dream home.",
  "price": 150000,
  "size": 5000,
  "location": "Rural Area, State",
  "terrain": "flat",
  "ownerId": "693fac63f5a66f6eec0683e6",
  "status": "available",
  "images": ["image1.jpg", "image2.jpg"],
  "createdAt": "2025-12-15T06:00:00.000Z",
  "updatedAt": "2025-12-15T06:00:00.000Z"
}
```

### Message
```json
{
  "_id": "693fad5af5a66f6eec0683f4",
  "senderId": "693fac63f5a66f6eec0683e6",
  "receiverId": "693fac7bf5a66f6eec0683e9",
  "propertyId": "693facc7f5a66f6eec0683ed",
  "content": "Hello, I'm interested in your property.",
  "isRead": false,
  "createdAt": "2025-12-15T06:00:00.000Z",
  "updatedAt": "2025-12-15T06:00:00.000Z"
}
```

## Testing Instructions

### 1. Get User Profile
```bash
curl -X GET "http://127.0.0.1:5500/api/users/693fac63f5a66f6eec0683e6"
```

### 2. Get User's Properties
```bash
curl -X GET "http://127.0.0.1:5500/api/properties/user/693fac63f5a66f6eec0683e6"
```

### 3. Get User's Messages
```bash
curl -X GET "http://127.0.0.1:5500/api/messages/conversation/693fac63f5a66f6eec0683e6"
```

### 4. Create New Property
```bash
curl -X POST "http://127.0.0.1:5500/api/properties" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "New Property",
    "description": "A beautiful piece of land",
    "price": 200000,
    "size": 4500,
    "location": "Suburban Area",
    "terrain": "flat",
    "ownerId": "693fac63f5a66f6eec0683e6"
  }'
```

### 5. Send Message
```bash
curl -X POST "http://127.0.0.1:5500/api/messages" \
  -H "Content-Type: application/json" \
  -d '{
    "senderId": "693fac63f5a66f6eec0683e6",
    "receiverId": "693fac7bf5a66f6eec0683e9",
    "content": "Hello, I am interested in your property!"
  }'
```

### 6. Update User Profile
```bash
curl -X PUT "http://127.0.0.1:5500/api/users/693fac63f5a66f6eec0683e6" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Smith",
    "bio": "Updated bio information"
  }'
```

## Error Handling

All endpoints return appropriate HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict (e.g., duplicate email)
- `500` - Internal Server Error

Error responses follow this format:
```json
{
  "message": "Error description",
  "error": "Detailed error information"
}
```