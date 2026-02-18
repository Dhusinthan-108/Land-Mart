const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    fileName: {
        type: String,
        required: true
    },
    originalName: {
        type: String,
        required: true
    },
    fileType: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['identity', 'property', 'bank', 'other'],
        required: true
    },
    filePath: {
        type: String,
        required: true
    },
    password: {
        type: String,
        default: null
    },
    size: {
        type: Number,
        required: true
    },
    isPasswordProtected: {
        type: Boolean,
        default: false
    },
    uploadDate: {
        type: Date,
        default: Date.now
    },
    description: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

// Index for faster queries
documentSchema.index({ userId: 1, uploadDate: -1 });

module.exports = mongoose.model('Document', documentSchema);
