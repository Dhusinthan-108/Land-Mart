const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const Property = require('../models/Property');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, '../server.log');
function log(msg) {
    const timestamp = new Date().toISOString();
    const logMsg = `[${timestamp}] ${msg}\n`;
    try {
        fs.appendFileSync(logFile, logMsg);
    } catch (e) {
        console.error('Logging failed', e);
    }
    console.log(msg); // Keep console log too
}

// Helper to get User ID from simulated token
function getUserIdFromAuthHeader(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader) return null;
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
    const token = parts[1];

    // Token format is usually simulated-token-USERID-TIMESTAMP
    const tokenParts = token.split('-');

    // Extract the ID: it's usually at index 2 (simulated-token-ID-...)
    const id = tokenParts.length >= 3 ? tokenParts[2] : null;
    log(`Messages API - Extracted ID from token: ${id}`);
    return id;
}

// GET /api/messages/conversations - Get all conversations for the current user
router.get('/conversations', authenticateToken, async (req, res) => {
    try {
        const userId = getUserIdFromAuthHeader(req);
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        // Fetch all conversations where user is either buyer or seller
        // We use $or to be inclusive regardless of the user's primary role
        const conversations = await Conversation.find({
            $or: [{ buyerId: userId }, { sellerId: userId }]
        })
            .populate('buyerId', 'name email role')
            .populate('sellerId', 'name email role')
            .populate('propertyId', 'title location price images ownerId')
            .sort({ updatedAt: -1 });

        log(`[API] Extracted User ID: ${userId}`);
        log(`[API] Found ${conversations.length} conversations for user ${userId}`);

        // Calculate unread counts for each conversation
        const conversationsWithUnread = await Promise.all(conversations.map(async (conv) => {
            const unreadCount = await Message.countDocuments({
                conversationId: conv._id,
                senderId: { $ne: userId },
                isRead: false
            });
            return {
                ...conv.toObject(),
                unreadCount
            };
        }));

        res.json(conversationsWithUnread);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching conversations', error: error.message });
    }
});

// GET /api/messages/detail/:conversationId - Get messages in a conversation
router.get('/detail/:conversationId', authenticateToken, async (req, res) => {
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

        log(`[API] Fetching messages for conv ${conversationId}. Found: ${messages.length}`);
        if (messages.length > 0) {
            log(`[API] Sample message sender: ${messages[0].senderId ? messages[0].senderId._id : 'null'}`);
        }

        res.json({ conversation, messages });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching messages', error: error.message });
    }
});

// POST /api/messages/start - Start a new conversation
router.post('/start', authenticateToken, async (req, res) => {
    try {
        const userId = getUserIdFromAuthHeader(req);
        const { propertyId, initialMessage } = req.body;

        if (!propertyId) return res.status(400).json({ message: 'Property ID is required' });

        const property = await Property.findById(propertyId);
        if (!property) return res.status(404).json({ message: 'Property not found' });

        // Prevent messaging yourself
        if (property.ownerId.toString() === userId) {
            return res.status(400).json({ message: 'You cannot start a conversation with yourself about your own property' });
        }

        // Check if conversation already exists (User as buyer)
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

            // Create initial message
            const message = new Message({
                conversationId: conversation._id,
                senderId: userId,
                senderRole: 'buyer',
                content: initialMessage || 'Hi, I am interested in this property.'
            });
            await message.save();
        }

        // Populate and return
        await conversation.populate('buyerId sellerId propertyId');
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

        log(`[API] Saving new message from ${userId} to conv ${conversationId}`);
        await newMessage.save();
        log(`[API] Message saved: ${newMessage._id}`);

        // Update conversation last message
        conversation.lastMessage = content;
        conversation.lastSenderId = userId;
        await conversation.save();

        // Populate sender details for the socket event
        await newMessage.populate('senderId', 'name role');

        // Emit socket event
        const io = req.app.get('io');
        if (io) {
            // Emit to conversation room (for active chat UI)
            io.to(conversationId).emit('receive_message', newMessage);

            // Emit to recipient's user room (for global notifications)
            const recipientId = isBuyer ? conversation.sellerId : conversation.buyerId;
            io.to(recipientId.toString()).emit('receive_message', newMessage);

            log(`[Socket] Emitted receive_message to room ${conversationId} and user ${recipientId}`);
        }

        res.status(201).json(newMessage);
    } catch (error) {
        res.status(500).json({ message: 'Error sending message', error: error.message });
    }
});

// GET /api/messages/user/:otherUserId - Get conversation with a specific user
router.get('/user/:otherUserId', authenticateToken, async (req, res) => {
    try {
        const userId = getUserIdFromAuthHeader(req);
        const { otherUserId } = req.params;

        const conversation = await Conversation.findOne({
            $or: [
                { buyerId: userId, sellerId: otherUserId },
                { buyerId: otherUserId, sellerId: userId }
            ]
        }).populate('buyerId sellerId propertyId');

        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found' });
        }

        res.json(conversation);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching conversation', error: error.message });
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

        // Fetch conversation to get participant IDs
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found' });
        }

        // Mark messages where the current user is NOT the sender as read
        await Message.updateMany(
            { conversationId, senderId: { $ne: userId } },
            { isRead: true }
        );

        // Emit socket event for read receipt
        const io = req.app.get('io');
        if (io) {
            // Emit to conversation room
            io.to(conversationId).emit('messages_read', { conversationId, readBy: userId });

            // Also notify the OTHER user specifically if they are on dashboard
            const otherUserId = conversation.buyerId.toString() === userId ? conversation.sellerId : conversation.buyerId;
            io.to(otherUserId.toString()).emit('messages_read', { conversationId, readBy: userId });

            log(`[Socket] Emitted messages_read to room ${conversationId} and user ${otherUserId}`);
        }

        res.json({ message: 'Messages marked as read' });
    } catch (error) {
        res.status(500).json({ message: 'Error marking messages as read', error: error.message });
    }
});

// PUT /api/messages/:messageId/read - Mark a specific message as read
router.put('/:messageId/read', authenticateToken, async (req, res) => {
    try {
        const userId = getUserIdFromAuthHeader(req);
        const { messageId } = req.params;

        const message = await Message.findById(messageId);
        if (!message) return res.status(404).json({ message: 'Message not found' });

        message.isRead = true;
        await message.save();

        // Emit socket event
        const io = req.app.get('io');
        if (io) {
            io.to(message.conversationId.toString()).emit('message_read', { messageId, conversationId: message.conversationId });
        }

        res.json({ message: 'Message marked as read' });
    } catch (error) {
        res.status(500).json({ message: 'Error marking message as read', error: error.message });
    }
});

// PUT /api/messages/read-all - Mark all messages for the current user as read
router.put('/read-all', authenticateToken, async (req, res) => {
    try {
        const userId = getUserIdFromAuthHeader(req);
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        // Update all messages where the user is NOT the sender to isRead: true
        const result = await Message.updateMany(
            { senderId: { $ne: userId }, isRead: false },
            { $set: { isRead: true } }
        );

        res.json({
            message: 'All messages marked as read',
            count: result.modifiedCount
        });
    } catch (error) {
        res.status(500).json({ message: 'Error marking all as read', error: error.message });
    }
});

module.exports = router;