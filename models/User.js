const mongoose = require('mongoose');

// Define the User schema
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['buyer', 'seller', 'admin'],
        default: 'buyer'
    },
    phone: {
        type: String
    },
    bio: {
        type: String
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true // This will automatically add createdAt and updatedAt fields
});

// Create the User model
const User = mongoose.model('User', userSchema);

module.exports = User;