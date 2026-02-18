const express = require('express');
const router = express.Router();
const Property = require('../models/Property');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

// GET /api/properties - Get all properties with pagination and optimization
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Optimization: Use .lean(), select only necessary fields, and implement pagination
        const properties = await Property.find({ status: { $in: ['available', 'pending_approval'] } })
            .select('title price location size terrain images ownerId createdAt')
            .populate('ownerId', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await Property.countDocuments({ status: { $in: ['available', 'pending_approval'] } });

        res.json({
            properties,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching properties:', error);
        res.status(500).json({ message: 'Error fetching properties', error: error.message });
    }
});

// GET /api/properties/user/:userId - Get properties by user ID
router.get('/user/:userId', authenticateToken, async (req, res) => {
    try {
        const properties = await Property.find({ ownerId: req.params.userId })
            .populate('ownerId', 'name email')
            .sort({ createdAt: -1 })
            .lean();
        res.json(properties);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching properties', error: error.message });
    }
});

// GET /api/properties/:id - Get property by ID
router.get('/:id', async (req, res) => {
    try {
        const property = await Property.findById(req.params.id).populate('ownerId', 'name email').lean();
        if (!property) {
            return res.status(404).json({ message: 'Property not found' });
        }
        res.json(property);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching property', error: error.message });
    }
});

// POST /api/properties - Create a new property
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { title, description, price, size, location, terrain, ownerId, images } = req.body;

        // Validation
        if (!title || !description || !price || !size || !location || !terrain || !ownerId) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const newProperty = new Property({
            title,
            description,
            price,
            size,
            location,
            terrain,
            ownerId,
            images: images || []
        });

        const savedProperty = await newProperty.save();
        // Populate the owner information before sending response
        await savedProperty.populate('ownerId', 'name email');
        res.status(201).json(savedProperty);
    } catch (error) {
        res.status(500).json({ message: 'Error creating property', error: error.message });
    }
});

// PUT /api/properties/:id - Update property
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        // Get the authenticated user ID from the token
        // In a real app, you would decode the JWT to get the user ID
        // For now, we'll extract it from the simulated token
        const authHeader = req.headers.authorization;
        const token = authHeader.split(' ')[1];
        const userId = token.split('-')[2]; // Extract user ID from simulated token

        const { title, description, price, size, location, terrain, images } = req.body;

        // Find the property to check ownership
        const property = await Property.findById(req.params.id);
        if (!property) {
            return res.status(404).json({ message: 'Property not found' });
        }

        // Check if the requesting user is the owner of the property
        if (property.ownerId.toString() !== userId) {
            return res.status(403).json({ message: 'Access denied. You can only update your own properties.' });
        }

        const updates = {};
        if (title) updates.title = title;
        if (description) updates.description = description;
        if (price) updates.price = price;
        if (size) updates.size = size;
        if (location) updates.location = location;
        if (terrain) updates.terrain = terrain;
        if (images !== undefined) updates.images = images;

        const updatedProperty = await Property.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true, runValidators: true }
        ).populate('ownerId', 'name email');

        res.json(updatedProperty);
    } catch (error) {
        res.status(500).json({ message: 'Error updating property', error: error.message });
    }
});

// DELETE /api/properties/:id - Delete property
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        console.log(`[DELETE] Attempting to remove property: ${req.params.id}`);

        // Get authenticated user ID from token
        const authHeader = req.headers.authorization;
        const token = authHeader.split(' ')[1];
        const userId = token.split('-')[2];

        // Find the property to check ownership
        const property = await Property.findById(req.params.id);
        if (!property) {
            console.warn(`[DELETE] Property not found: ${req.params.id}`);
            return res.status(404).json({ message: 'Property not found' });
        }

        // Check ownership
        if (property.ownerId.toString() !== userId) {
            console.warn(`[DELETE] Unauthorized attempt by user ${userId} to remove property ${req.params.id}`);
            return res.status(403).json({ message: 'Access denied. You can only delete your own properties.' });
        }

        // Delete the property
        console.log(`[DELETE] Successfully removing property: ${req.params.id}`);
        await Property.findByIdAndDelete(req.params.id);

        res.json({ message: 'Property deleted successfully' });
    } catch (error) {
        console.error(`[DELETE] Error deleting property ${req.params.id}:`, error);
        res.status(500).json({ message: 'Error deleting property', error: error.message });
    }
});

// POST /api/properties/:id/save - Save a property for a user
router.post('/:id/save', authenticateToken, async (req, res) => {
    try {
        // Get the authenticated user ID from the token
        // In a real app, you would decode the JWT to get the user ID
        // For now, we'll extract it from the simulated token
        const authHeader = req.headers.authorization;
        const token = authHeader.split(' ')[1];
        const userId = token.split('-')[2]; // Extract user ID from simulated token

        // Find the property
        const property = await Property.findById(req.params.id);
        if (!property) {
            return res.status(404).json({ message: 'Property not found' });
        }

        // Find the user and add property to savedProperties if not already saved
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if property is already saved
        if (user.savedProperties.includes(property._id)) {
            return res.status(400).json({ message: 'Property already saved' });
        }

        // Add property to user's savedProperties
        user.savedProperties.push(property._id);
        await user.save();

        res.json({ message: 'Property saved successfully', savedProperties: user.savedProperties });
    } catch (error) {
        res.status(500).json({ message: 'Error saving property', error: error.message });
    }
});

// POST /api/properties/:id/unsave - Unsave a property for a user
router.post('/:id/unsave', authenticateToken, async (req, res) => {
    try {
        // Get the authenticated user ID from the token
        // In a real app, you would decode the JWT to get the user ID
        // For now, we'll extract it from the simulated token
        const authHeader = req.headers.authorization;
        const token = authHeader.split(' ')[1];
        const userId = token.split('-')[2]; // Extract user ID from simulated token

        // Find the property
        const property = await Property.findById(req.params.id);
        if (!property) {
            return res.status(404).json({ message: 'Property not found' });
        }

        // Find the user and remove property from savedProperties
        const user = await User.findByIdAndUpdate(
            userId,
            { $pull: { savedProperties: property._id } },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'Property unsaved successfully', savedProperties: user.savedProperties });
    } catch (error) {
        res.status(500).json({ message: 'Error unsaving property', error: error.message });
    }
});

// GET /api/properties/saved/:userId - Get saved properties for a user
router.get('/saved/:userId', authenticateToken, async (req, res) => {
    try {
        // Find the user and populate saved properties
        const user = await User.findById(req.params.userId).populate({
            path: 'savedProperties',
            populate: {
                path: 'ownerId',
                select: 'name email'
            }
        }).lean();

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user.savedProperties);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching saved properties', error: error.message });
    }
});

module.exports = router;