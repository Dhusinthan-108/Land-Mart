# Land Mart

A marketplace for buying and selling land properties built with Node.js, Express, and MongoDB.

## Table of Contents

- [Description](#description)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Database Models](#database-models)
- [Frontend Pages](#frontend-pages)
- [License](#license)

## Description

Land Mart is a comprehensive online marketplace platform that allows users to buy and sell land properties. The platform provides separate dashboards for buyers and sellers, property listings, search functionality, messaging system, and secure transactions.

## Features

- User authentication (registration and login)
- Role-based access control (buyer, seller, admin)
- Property listing and management
- Property search and filtering
- Save favorite properties
- Messaging system between buyers and sellers
- User profiles and settings
- Property approval workflow
- Responsive design for all devices

## Technology Stack

### Frontend
- **HTML5 & CSS3**: Semantic structure and modern styling.
- **JavaScript (ES6+)**: Core client-side logic.
- **Socket.io Client**: Real-time bidirectional event-based communication.
- **FontAwesome**: Iconography.

### Backend
- **Node.js**: JavaScript runtime environment.
- **Express.js**: Web application framework.
- **Socket.io**: Real-time server-side communication.
- **Multer**: Middleware for handling `multipart/form-data` (image uploads).

### Database
- **MongoDB**: NoSQL database for flexible data storage.
- **Mongoose**: Object Data Modeling (ODM) library for MongoDB and Node.js.

### Authentication & Security
- **JWT (JSON Web Tokens)**: Secure user authentication.
- **bcryptjs**: Password hashing for security.
- **cors**: Cross-Origin Resource Sharing handling.
- **dotenv**: Environment variable management.

## Deployment

For detailed instructions on how to deploy this application to production usage (e.g., using Render and MongoDB Atlas), please refer to the [Deployment Guide](DEPLOYMENT.md).

### Quick Start (Production)
```bash
npm start
```
The application will run with `NODE_ENV=production` optimizations.

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or cloud instance)
- npm (comes with Node.js)

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd land-mart
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Configuration

Create a `.env` file in the root directory with the following environment variables:

```env
# MongoDB Connection String
DB_HOST=mongodb://localhost:27017/landmart
DB_NAME=landmart

# Server Configuration
PORT=5500
HOST=localhost

# JWT Configuration
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=24h

# Other Configurations (optional)
STRIPE_PUBLIC_KEY=
STRIPE_SECRET_KEY=
EMAIL_SERVICE=gmail
EMAIL_USER=
EMAIL_PASS=
```

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The application will be available at `http://localhost:5500`

## Project Structure

```
land-mart/
├── client/                 # Frontend files
│   ├── js/                 # JavaScript files
│   ├── styles/             # CSS stylesheets
│   ├── add-property.html   # Add property form
│   ├── index.html          # Homepage
│   ├── login.html          # Login page
│   ├── register.html       # Registration page
│   ├── properties.html     # Properties listing
│   ├── property-detail.html # Property details page
│   ├── unified-dashboard.html # Main dashboard
│   └── ...                 # Other HTML pages
├── models/                 # Database models
│   ├── Property.js         # Property model
│   ├── User.js             # User model
│   └── Message.js          # Message model
├── routes/                 # API routes
│   ├── properties.js       # Property routes
│   ├── users.js            # User routes
│   └── messages.js         # Message routes
├── config/                 # Configuration files
│   └── config.js           # App configuration
├── .env                    # Environment variables
├── server.js               # Main server file
├── package.json            # Project dependencies
└── README.md               # This file
```

## API Endpoints

### Users
- `POST /api/users` - Register a new user
- `POST /api/users/login` - Login user
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Properties
- `POST /api/properties` - Create a new property
- `GET /api/properties` - Get all properties
- `GET /api/properties/:id` - Get property by ID
- `GET /api/properties/user/:userId` - Get properties by user ID
- `PUT /api/properties/:id` - Update property
- `DELETE /api/properties/:id` - Delete property

### Messages
- `POST /api/messages` - Send a new message
- `GET /api/messages` - Get all messages
- `GET /api/messages/conversation/:userId` - Get messages for a conversation
- `GET /api/messages/user/:userId` - Get messages for a user
- `PUT /api/messages/:id/read` - Mark message as read

## Database Models

### User Model
```javascript
{
  name: String,
  email: String (unique),
  password: String,
  role: String (buyer/seller/admin),
  phone: String,
  bio: String,
  isActive: Boolean
}
```

### Property Model
```javascript
{
  title: String,
  description: String,
  price: Number,
  size: Number,
  location: String,
  terrain: String (flat/hilly/mountainous/waterfront),
  ownerId: ObjectId (ref: User),
  status: String (available/pending/sold/pending_approval),
  images: [String]
}
```

### Message Model
```javascript
{
  senderId: ObjectId (ref: User),
  receiverId: ObjectId (ref: User),
  propertyId: ObjectId (ref: Property),
  content: String,
  isRead: Boolean
}
```

## Frontend Pages

- **Homepage** (`index.html`) - Landing page with property search
- **Login** (`login.html`) - User login page
- **Register** (`register.html`) - User registration page
- **Properties** (`properties.html`) - Browse all properties
- **Property Detail** (`property-detail.html`) - Detailed view of a property
- **Add Property** (`add-property.html`) - Form to add new properties
- **Dashboard** (`unified-dashboard.html`) - Main user dashboard with tabs:
  - Overview
  - My Properties
  - Saved Properties
  - Messages
  - Settings

## License

This project is licensed under the MIT License.