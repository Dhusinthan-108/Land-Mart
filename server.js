const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config(); // Load environment variables

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5503;

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for now (adjust for production)
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

// Attach io to app so routes can access it
app.set('io', io);

// Socket.io logic
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Join a conversation room
  socket.on('join_conversation', (conversationId) => {
    socket.join(conversationId);
    console.log(`Client ${socket.id} joined conversation: ${conversationId}`);
  });

  // Join a personal user room for global notifications
  socket.on('join_user', (userId) => {
    socket.join(userId);
    console.log(`Client ${socket.id} joined user room: ${userId}`);
  });

  // Leave a conversation room
  socket.on('leave_conversation', (conversationId) => {
    socket.leave(conversationId);
    console.log(`Client ${socket.id} left conversation: ${conversationId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Import routes
const propertyRoutes = require('./routes/properties');
const userRoutes = require('./routes/users');
const messageRoutes = require('./routes/messages');
const appSettingsRoutes = require('./routes/appSettings');
const transactionRoutes = require('./routes/transactions'); // Add transaction routes
const documentRoutes = require('./routes/documents'); // Add document routes

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
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
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
app.use('/api/messages', messageRoutes);
console.log('User routes mounted');
app.use('/api/app-settings', appSettingsRoutes);
app.use('/api/transactions', transactionRoutes); // Mount transaction routes
app.use('/api/documents', documentRoutes); // Mount document routes

// Serve static files
// 1. Serve from root for shorter URLs (e.g., /index.html)
app.use(express.static(path.join(__dirname, 'client')));
// 2. Also serve with /client prefix for requests that include it (as seen in user screenshot)
app.use('/client', express.static(path.join(__dirname, 'client')));

// Catch-all route for SPA (must be last)
app.get('*', (req, res) => {
  // 1. Prevent CORB on API calls by returning JSON for missing routes
  if (req.path.startsWith('/api/')) {
    console.log(`API 404: ${req.method} ${req.path}`);
    return res.status(404).json({
      error: 'Not Found',
      message: `API endpoint ${req.path} does not exist`,
      help: 'Check your API_CONFIG or route definitions'
    });
  }

  // 2. Prevent CORB on static assets (CSS, JS, etc.)
  if (req.path.includes('.') && !req.path.endsWith('.html')) {
    console.log(`Asset 404: ${req.method} ${req.path}`);
    return res.status(404).send('Not Found');
  }

  console.log(`Catch-all route: serving index.html for ${req.url}`);
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
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// Start server
server.listen(PORT, () => {
  console.log(`Land Mart server running on port ${PORT}`);
  console.log(`Frontend should access APIs at the current origin`);
});