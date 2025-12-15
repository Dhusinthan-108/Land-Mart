const express = require('express');
const router = express.Router();
const Property = require('../models/Property');

// GET /api/properties - Get all properties
router.get('/', async (req, res) => {
    try {
        const properties = await Property.find().populate('ownerId', 'name email');
        res.json(properties);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching properties', error: error.message });
    }
});

// GET /api/properties/user/:userId - Get properties by user ID
router.get('/user/:userId', async (req, res) => {
    try {
        const properties = await Property.find({ ownerId: req.params.userId }).populate('ownerId', 'name email');
        res.json(properties);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching properties', error: error.message });
    }
});

// GET /api/properties/:id - Get property by ID
router.get('/:id', async (req, res) => {
    try {
        const property = await Property.findById(req.params.id).populate('ownerId', 'name email');
        if (!property) {
            return res.status(404).json({ message: 'Property not found' });
        }
        res.json(property);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching property', error: error.message });
    }
});

// POST /api/properties - Create a new property
router.post('/', async (req, res) => {
    try {
        const { title, description, price, size, location, terrain, ownerId } = req.body;
        
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
            ownerId
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
router.put('/:id', async (req, res) => {
    try {
        // Check if user is authenticated (in a real app, you would verify JWT token)
        // For now, we'll expect ownerId in the request body for demo purposes
        const { title, description, price, size, location, terrain, ownerId } = req.body;
        
        // Find the property to check ownership
        const property = await Property.findById(req.params.id);
        if (!property) {
            return res.status(404).json({ message: 'Property not found' });
        }
        
        // Check if the requesting user is the owner of the property
        if (property.ownerId.toString() !== ownerId) {
            return res.status(403).json({ message: 'Access denied. You can only update your own properties.' });
        }
        
        const updates = {};
        if (title) updates.title = title;
        if (description) updates.description = description;
        if (price) updates.price = price;
        if (size) updates.size = size;
        if (location) updates.location = location;
        if (terrain) updates.terrain = terrain;
        
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
router.delete('/:id', async (req, res) => {
    try {
        const property = await Property.findByIdAndDelete(req.params.id);
        
        if (!property) {
            return res.status(404).json({ message: 'Property not found' });
        }
        
        res.json({ message: 'Property deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting property', error: error.message });
    }
});

module.exports = router;