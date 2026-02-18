const mongoose = require('mongoose');
const fs = require('fs');
require('dotenv').config();

async function checkData() {
    try {
        await mongoose.connect(process.env.DB_HOST || 'mongodb://localhost:27017/landmart');
        const db = mongoose.connection.db;

        const results = {};

        const msg = await db.collection('messages').findOne({});
        if (msg) {
            results.message = {
                _id: { type: typeof msg._id, constructor: msg._id.constructor.name, value: msg._id.toString() },
                conversationId: { type: typeof msg.conversationId, constructor: msg.conversationId.constructor.name, value: msg.conversationId.toString() },
                senderId: { type: typeof msg.senderId, constructor: msg.senderId.constructor.name, value: msg.senderId.toString() }
            };
        }

        const conv = await db.collection('conversations').findOne({});
        if (conv) {
            results.conversation = {
                _id: { type: typeof conv._id, constructor: conv._id.constructor.name, value: conv._id.toString() },
                buyerId: { type: typeof conv.buyerId, constructor: conv.buyerId.constructor.name, value: conv.buyerId.toString() },
                sellerId: { type: typeof conv.sellerId, constructor: conv.sellerId.constructor.name, value: conv.sellerId.toString() }
            };
        }

        fs.writeFileSync('diagnostic_results.json', JSON.stringify(results, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
checkData();
