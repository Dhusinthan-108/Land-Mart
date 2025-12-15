const express = require('express');
const router = express.Router();
const Message = require('../models/Message');

// GET /api/messages - Get all messages
router.get('/', async (req, res) => {
    try {
        const messages = await Message.find()
            .populate('senderId', 'name email')
            .populate('receiverId', 'name email')
            .populate('propertyId', 'title');
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching messages', error: error.message });
    }
});

// GET /api/messages/:id - Get message by ID
router.get('/:id', async (req, res) => {
    try {
        const message = await Message.findById(req.params.id)
            .populate('senderId', 'name email')
            .populate('receiverId', 'name email')
            .populate('propertyId', 'title');
        
        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }
        res.json(message);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching message', error: error.message });
    }
});

// GET /api/messages/conversation/:userId - Get conversation with a specific user
router.get('/conversation/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const conversation = await Message.find({
            $or: [
                { senderId: userId },
                { receiverId: userId }
            ]
        })
        .sort({ createdAt: 1 })
        .populate('senderId', 'name email')
        .populate('receiverId', 'name email')
        .populate('propertyId', 'title');
        
        res.json(conversation);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching conversation', error: error.message });
    }
});

// POST /api/messages - Create a new message
router.post('/', async (req, res) => {
    try {
        const { senderId, receiverId, propertyId, content } = req.body;
        
        // Validation
        if (!senderId || !receiverId || !content) {
            return res.status(400).json({ message: 'Sender, receiver, and content are required' });
        }
        
        const newMessage = new Message({
            senderId,
            receiverId,
            propertyId: propertyId || null,
            content
        });
        
        const savedMessage = await newMessage.save();
        // Populate references before sending response
        await savedMessage.populate('senderId', 'name email');
        await savedMessage.populate('receiverId', 'name email');
        await savedMessage.populate('propertyId', 'title');
        
        res.status(201).json(savedMessage);
    } catch (error) {
        res.status(500).json({ message: 'Error creating message', error: error.message });
    }
});

// PUT /api/messages/:id/read - Mark message as read
router.put('/:id/read', async (req, res) => {
    try {
        const message = await Message.findByIdAndUpdate(
            req.params.id,
            { isRead: true },
            { new: true }
        )
        .populate('senderId', 'name email')
        .populate('receiverId', 'name email')
        .populate('propertyId', 'title');
        
        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }
        
        res.json(message);
    } catch (error) {
        res.status(500).json({ message: 'Error updating message', error: error.message });
    }
});

module.exports = router;