const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config(); // Load environment variables
const app = express();
const PORT = process.env.PORT || 5503;

// Import routes
const propertyRoutes = require('./routes/properties');
const userRoutes = require('./routes/users');
const messageRoutes = require('./routes/messages');
const appSettingsRoutes = require('./routes/appSettings');
const transactionRoutes = require('./routes/transactions'); // Add transaction routes

console.log('Routes imported successfully');
console.log('User routes type:', typeof userRoutes);
console.log('User routes keys:', Object.keys(userRoutes || {}));

// CORS configuration - More flexible to handle different origins
// In production, you should restrict this to specific origins
const corsOptions = {
  origin: true, // Reflects the request origin
  optionsSuccessStatus: 200,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
};
// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors(corsOptions)); // Enable CORS for specific origins

// Handle preflight OPTIONS requests
app.options('*', cors(corsOptions));

// Debugging middleware to log all requests
app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  next();
});

// Very simple test routes to isolate the issue
app.get('/test-get', (req, res) => {
  res.json({ message: 'GET route working' });
});

app.post('/test-post', (req, res) => {
  res.json({ message: 'POST route working' });
});

// Test route to verify API is working
app.post('/api/test', (req, res) => {
  res.json({ message: 'API is working correctly' });
});

// Specific OPTIONS handler for user routes
app.options('/api/users/register', cors(corsOptions));
app.options('/api/users/login', cors(corsOptions));

// API Routes (placed before static files and catch-all route to ensure they take precedence)
console.log('Mounting API routes...');
app.use('/api/properties', propertyRoutes);
app.use('/api/users', userRoutes);
console.log('User routes mounted');
app.use('/api/messages', messageRoutes);
app.use('/api/app-settings', appSettingsRoutes);
app.use('/api/transactions', transactionRoutes); // Mount transaction routes

// Serve static files (placed after API routes but before catch-all)
app.use(express.static(path.join(__dirname, 'client')));

// Catch-all route for SPA (must be last)
app.get('*', (req, res) => {
  console.log(`Catch-all route hit: ${req.method} ${req.url}`);
  res.sendFile(path.join(__dirname, 'client', 'index.html'));
});

// Development logging middleware
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

    // Capture response data
    const originalSend = res.send;
    res.send = function (data) {
      console.log('\n=== OUTGOING RESPONSE ===');
      console.log(`Status: ${res.statusCode}`);
      console.log(`Data:`, typeof data === 'string' ? data : JSON.stringify(data, null, 2));
      console.log('=========================\n');
      originalSend.call(this, data);
    };

    console.log('========================\n');
    next();
  });
}

// Connect to MongoDB
const mongoURI = process.env.DB_HOST || 'mongodb://localhost:27017/landmart';
console.log('Attempting to connect to MongoDB with URI:', mongoURI.substring(0, 50) + '...'); // Log first 50 chars for security
mongoose.connect(mongoURI)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });

// Start server
app.listen(PORT, () => {
  console.log(`Land Mart server running on port ${PORT}`);
  console.log(`Frontend should access APIs at the current origin`);
});