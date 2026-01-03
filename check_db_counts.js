const mongoose = require('mongoose');
require('dotenv').config();

async function checkCounts() {
    try {
        await mongoose.connect(process.env.DB_HOST);
        const User = require('./models/User');
        const Property = require('./models/Property');
        const Conversation = require('./models/Conversation');

        const buyer = await User.findOne({ name: 'Test Buyer' });
        const seller = await User.findOne({ name: 'Test Seller' });

        console.log('--- BUYER ---');
        if (buyer) {
            console.log(`ID: ${buyer._id}`);
            console.log(`Saved Properties: ${buyer.savedProperties.length}`);
            const convs = await Conversation.countDocuments({ buyerId: buyer._id });
            console.log(`Conversations: ${convs}`);
        }

        console.log('--- SELLER ---');
        if (seller) {
            console.log(`ID: ${seller._id}`);
            const listed = await Property.countDocuments({ ownerId: seller._id });
            console.log(`Listed Properties: ${listed}`);
            const convs = await Conversation.countDocuments({ sellerId: seller._id });
            console.log(`Conversations: ${convs}`);
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error(error);
    }
}

checkCounts();
