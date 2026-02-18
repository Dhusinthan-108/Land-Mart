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
        default: 'available'
    },
    images: [{
        type: String
    }]
}, {
    timestamps: true
});

// Add indexes for frequently queried fields
propertySchema.index({ createdAt: -1 });
propertySchema.index({ status: 1 });
propertySchema.index({ ownerId: 1 });
propertySchema.index({ price: 1 });
propertySchema.index({ location: 'text', title: 'text' });

// Create the Property model
const Property = mongoose.model('Property', propertySchema);

module.exports = Property;