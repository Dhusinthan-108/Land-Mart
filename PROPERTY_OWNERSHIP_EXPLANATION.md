# How Property Ownership Works in Land Mart

## Adding Properties

When you add a property through the "Add Property" form:

1. The form collects property details (title, description, price, size, location, terrain)
2. The JavaScript code in `main.js` automatically adds your user ID as the `ownerId`
3. The property is sent to the backend API at `/api/properties` via a POST request
4. The backend creates the property in the database with your user ID as the owner

## Viewing "My Properties"

When you view the "My Properties" section:

1. The system makes a request to `/api/properties/user/{your-user-id}`
2. The backend finds all properties where `ownerId` equals your user ID
3. These properties are displayed in your "My Properties" section

## Technical Implementation

### Frontend (client/js/main.js)
- `handlePropertySubmission()` function collects form data and adds `ownerId`
- `loadMyProperties()` function fetches properties for the current user

### Backend (routes/properties.js)
- POST `/api/properties` creates a new property with the provided `ownerId`
- GET `/api/properties/user/:userId` returns all properties owned by the specified user

This means that any property you add will automatically appear in your "My Properties" section because the system associates each property with your user account when it's created.