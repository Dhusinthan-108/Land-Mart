const mongoose = require('mongoose');

// Define the Property schema
const propertySchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    size: {
        type: Number,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    terrain: {
        type: String,
        enum: ['flat', 'hilly', 'mountainous', 'waterfront'],
        required: true
    },
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['available', 'pending', 'sold', 'pending_approval'],
        default: 'pending_approval'
    },
    images: [{
        type: String
    }]
}, {
    timestamps: true // This will automatically add createdAt and updatedAt fields
});

// Create the Property model
const Property = mongoose.model('Property', propertySchema);

module.exports = Property;