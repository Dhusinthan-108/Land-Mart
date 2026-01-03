# Messages Feature Structure

## Folder Structure
```
client/
├── messages.html              # Main messages page
├── styles/
│   └── main.css              # All CSS including messages styles
├── js/
│   ├── main.js               # Main JavaScript file
│   └── messages.js           # Dedicated messages functionality
└── ...

routes/
└── messages.js               # Backend API routes for messages

models/
└── Message.js                # Message database model

server.js                     # Main server file (registers messages routes)
```

## File Responsibilities

### Frontend Files

#### `client/messages.html`
- Main messages page
- Contains HTML structure for conversations sidebar and message area
- Links to CSS and JavaScript files
- No embedded JavaScript logic (clean separation)

#### `client/styles/main.css`
- Contains all CSS including messages-specific styles
- Responsive design for mobile devices
- Consistent styling with rest of application

#### `client/js/messages.js`
- Dedicated JavaScript class for messages functionality
- Handles all frontend logic for messages
- Clean separation from main application logic
- Methods for:
  - Loading conversations
  - Loading messages
  - Sending messages
  - UI updates

#### `client/js/main.js`
- Main application JavaScript
- Contains shared utilities and common functionality
- Does not contain messages-specific logic

### Backend Files

#### `routes/messages.js`
- Express routes for messages API
- Endpoints:
  - `GET /api/messages` - Get all messages (admin)
  - `GET /api/messages/:id` - Get specific message
  - `GET /api/messages/conversation/:userId` - Get user conversations
  - `POST /api/messages` - Create new message
  - `PUT /api/messages/:id/read` - Mark message as read

#### `models/Message.js`
- Mongoose schema for messages
- References to User and Property models
- Automatic timestamp creation

#### `server.js`
- Registers messages routes
- Connects to MongoDB
- Sets up middleware

## Data Flow

### Loading Conversations
1. User visits `messages.html`
2. `messages.js` initializes and gets current user from localStorage
3. Calls `GET /api/messages/conversation/:userId`
4. Backend queries MongoDB for messages
5. Messages returned with populated user/property data
6. Frontend groups messages by conversation partner
7. Conversations displayed in sidebar

### Sending Messages
1. User types message and clicks "Send"
2. `messages.js` validates input and prepares message data
3. Calls `POST /api/messages` with message data
4. Backend validates and creates new message in MongoDB
5. Message populated with user references
6. Backend returns created message
7. Frontend adds message to UI and refreshes conversation list

## API Integration Examples

### Fetching Conversations
```javascript
const response = await fetch('http://localhost:5500/api/messages/conversation/USER_ID');
const messages = await response.json();
```

### Sending Messages
```javascript
const messageData = {
    senderId: 'SENDER_USER_ID',
    receiverId: 'RECEIVER_USER_ID',
    content: 'Hello, this is a test message!',
    propertyId: 'PROPERTY_ID' // Optional
};

const response = await fetch('http://localhost:5500/api/messages', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(messageData)
});
```

## UI Components

### Conversations Sidebar
- Shows list of conversations
- Displays last message preview
- Shows timestamp
- Highlights active conversation
- Responsive design for mobile

### Messages Area
- Displays messages in chat format
- Different styling for sent vs received messages
- Shows timestamps
- Auto-scrolls to newest message
- Property context when applicable

### Message Input
- Text area for typing messages
- Send button
- Enter key support (Shift+Enter for new line)
- Hidden until conversation selected

## Error Handling

### Network Errors
- Graceful degradation
- User-friendly error messages
- Retry mechanisms

### Validation Errors
- Input validation
- Required field checks
- User feedback

### Authentication Errors
- Redirect to login when not authenticated
- Session management

## Best Practices Implemented

1. **Separation of Concerns**
   - HTML, CSS, and JavaScript separated
   - Dedicated messages class
   - Clean API routes

2. **Responsive Design**
   - Mobile-friendly layout
   - Flexible components
   - Touch-friendly elements

3. **Performance**
   - Efficient data fetching
   - Minimal DOM updates
   - Lazy loading where appropriate

4. **Security**
   - User authentication checks
   - Input sanitization
   - Proper error handling

5. **Maintainability**
   - Well-documented code
   - Consistent naming conventions
   - Modular structure