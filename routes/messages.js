const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const Property = require('../models/Property');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

// Helper to get User ID from simulated token
function getUserIdFromAuthHeader(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader) return null;
    const token = authHeader.split(' ')[1];
    if (!token) return null;
    const parts = token.split('-');
    return parts.length >= 3 ? parts[2] : null;
}

// GET /api/messages/conversations - Get all conversations for the current user
router.get('/conversations', authenticateToken, async (req, res) => {
    try {
        const userId = getUserIdFromAuthHeader(req);
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        let query = {};
        if (user.role === 'buyer') {
            query = { buyerId: userId };
        } else if (user.role === 'seller') {
            query = { sellerId: userId };
        } else {
            // Admin can see everything? Or just restrict to buyers/sellers
            query = { $or: [{ buyerId: userId }, { sellerId: userId }] };
        }

        const conversations = await Conversation.find(query)
            .populate('buyerId', 'name email role')
            .populate('sellerId', 'name email role')
            .populate('propertyId', 'title location price images')
            .sort({ updatedAt: -1 });

        res.json(conversations);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching conversations', error: error.message });
    }
});

// GET /api/messages/conversation/:conversationId - Get messages in a conversation
router.get('/conversation/:conversationId', authenticateToken, async (req, res) => {
    try {
        const userId = getUserIdFromAuthHeader(req);
        const { conversationId } = req.params;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return res.status(404).json({ message: 'Conversation not found' });

        // Authorization check
        if (conversation.buyerId.toString() !== userId && conversation.sellerId.toString() !== userId) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const messages = await Message.find({ conversationId })
            .populate('senderId', 'name role')
            .sort({ createdAt: 1 });

        res.json({ conversation, messages });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching messages', error: error.message });
    }
});

// POST /api/messages/start - Start a new conversation (Buyer only)
router.post('/start', authenticateToken, async (req, res) => {
    try {
        const userId = getUserIdFromAuthHeader(req);
        const { propertyId, initialMessage } = req.body;

        if (!propertyId) return res.status(400).json({ message: 'Property ID is required' });

        const property = await Property.findById(propertyId);
        if (!property) return res.status(404).json({ message: 'Property not found' });

        const buyer = await User.findById(userId);
        if (!buyer || buyer.role !== 'buyer') {
            return res.status(403).json({ message: 'Only buyers can start a conversation' });
        }

        // Check if buyer liked/saved the property
        if (!buyer.savedProperties.includes(propertyId)) {
            return res.status(403).json({ message: 'You must like/save this property before messaging the seller' });
        }

        // Check if conversation already exists
        let conversation = await Conversation.findOne({ buyerId: userId, propertyId });

        if (!conversation) {
            conversation = new Conversation({
                buyerId: userId,
                sellerId: property.ownerId,
                propertyId: propertyId,
                lastMessage: initialMessage || 'Interested in this property',
                lastSenderId: userId
            });
            await conversation.save();

            // Create initial message if provided
            const message = new Message({
                conversationId: conversation._id,
                senderId: userId,
                senderRole: 'buyer',
                content: initialMessage || 'Hi, I am interested in this property.'
            });
            await message.save();
        }

        res.status(201).json(conversation);
    } catch (error) {
        res.status(500).json({ message: 'Error starting conversation', error: error.message });
    }
});

// POST /api/messages - Send a message in an existing conversation
router.post('/', authenticateToken, async (req, res) => {
    try {
        const userId = getUserIdFromAuthHeader(req);
        const { conversationId, content } = req.body;

        if (!conversationId || !content) {
            return res.status(400).json({ message: 'Conversation ID and content are required' });
        }

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return res.status(404).json({ message: 'Conversation not found' });

        // Authorization check
        const isBuyer = conversation.buyerId.toString() === userId;
        const isSeller = conversation.sellerId.toString() === userId;

        if (!isBuyer && !isSeller) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const senderRole = isBuyer ? 'buyer' : 'seller';

        const newMessage = new Message({
            conversationId,
            senderId: userId,
            senderRole,
            content
        });

        await newMessage.save();

        // Update conversation last message
        conversation.lastMessage = content;
        conversation.lastSenderId = userId;
        await conversation.save();

        res.status(201).json(newMessage);
    } catch (error) {
        res.status(500).json({ message: 'Error sending message', error: error.message });
    }
});

// GET /api/messages/check/:propertyId - Check if a buyer has an existing conversation for a property
router.get('/check/:propertyId', authenticateToken, async (req, res) => {
    try {
        const userId = getUserIdFromAuthHeader(req);
        const { propertyId } = req.params;

        const conversation = await Conversation.findOne({ buyerId: userId, propertyId });
        res.json({ exists: !!conversation, conversationId: conversation ? conversation._id : null });
    } catch (error) {
        res.status(500).json({ message: 'Error checking conversation', error: error.message });
    }
});

// PUT /api/messages/read/:conversationId - Mark all messages in a conversation as read
router.put('/read/:conversationId', authenticateToken, async (req, res) => {
    try {
        const userId = getUserIdFromAuthHeader(req);
        const { conversationId } = req.params;

        // Mark messages where the current user is NOT the sender as read
        await Message.updateMany(
            { conversationId, senderId: { $ne: userId } },
            { isRead: true }
        );

        res.json({ message: 'Messages marked as read' });
    } catch (error) {
        res.status(500).json({ message: 'Error marking messages as read', error: error.message });
    }
});

module.exports = router;