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
    // Add savedProperties field as an array of ObjectIds referencing Property documents
    savedProperties: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Property'
    }],

    // Privacy settings
    profilePublic: {
        type: Boolean,
        default: true
    },
    showContactInfo: {
        type: Boolean,
        default: true
    },
    activityVisibility: {
        type: Boolean,
        default: true
    },
    // Security settings
    twoFactorAuth: {
        type: Boolean,
        default: false
    },
    twoFactorSecret: {
        type: String,
        default: null
    },
    backupCodes: [{
        type: String
    }],
    securityPin: {
        type: String,
        default: null
    },
    loginHistory: [{
        timestamp: {
            type: Date,
            default: Date.now
        },
        ipAddress: String,
        device: String,
        userAgent: String
    }],
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