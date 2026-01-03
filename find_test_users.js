const mongoose = require('mongoose');
require('dotenv').config();

async function findUsers() {
    try {
        await mongoose.connect(process.env.DB_HOST);
        console.log('Connected to MongoDB');

        const User = require('./models/User');
        const Property = require('./models/Property');
        const Conversation = require('./models/Conversation');
        const Message = require('./models/Message');

        const buyer = await User.findOne({ name: 'Test Buyer' });
        const seller = await User.findOne({ name: 'Test Seller' });

        console.log('--- USER DATA ---');
        if (buyer) {
            console.log(`Buyer: ID=${buyer._id}, Name=${buyer.name}, Email=${buyer.email}, SavedProperties=${buyer.savedProperties.length}`);
        } else {
            console.log('Buyer "Test Buyer" not found');
        }

        if (seller) {
            console.log(`Seller: ID=${seller._id}, Name=${seller.name}, Email=${seller.email}`);
            const properties = await Property.find({ ownerId: seller._id });
            console.log(`Seller Properties Count: ${properties.length}`);
        } else {
            console.log('Seller "Test Seller" not found');
        }

        const conversations = await Conversation.find();
        console.log(`Total Conversations: ${conversations.length}`);

        const messages = await Message.find();
        console.log(`Total Messages: ${messages.length}`);

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

findUsers();
