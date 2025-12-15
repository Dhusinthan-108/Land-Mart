const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config(); // Load environment variables
const app = express();
const PORT = process.env.PORT || 5500;

// Import routes
const propertyRoutes = require('./routes/properties');
const userRoutes = require('./routes/users');
const messageRoutes = require('./routes/messages');

// CORS configuration
const corsOptions = {
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5500', 'http://127.0.0.1:5500'],
  optionsSuccessStatus: 200,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
};

// Middleware
app.use(cors(corsOptions)); // Enable CORS for specific origins
app.use(express.static(path.join(__dirname, 'client')));
app.use(express.json());

// Handle preflight OPTIONS requests
app.options('*', cors(corsOptions));

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

// Routes
app.use('/api/properties', propertyRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Land Mart server running on port ${PORT}`);
});