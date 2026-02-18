require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Property = require('./models/Property');
const Conversation = require('./models/Conversation');
const Message = require('./models/Message');

async function activateMessaging() {
    try {
        await mongoose.connect(process.env.DB_HOST || 'mongodb://localhost:27017/landmart');
        console.log('✓ Connected to MongoDB\n');

        // Get users
        const users = await User.find().limit(5);
        const properties = await Property.find().limit(5);

        console.log('=== DATABASE STATUS ===');
        console.log(`Users: ${users.length}`);
        console.log(`Properties: ${properties.length}`);

        // Check existing conversations
        const existingConvs = await Conversation.find();
        const existingMsgs = await Message.find();
        console.log(`Existing Conversations: ${existingConvs.length}`);
        console.log(`Existing Messages: ${existingMsgs.length}\n`);

        // Create a test conversation if none exist
        if (existingConvs.length === 0 && users.length >= 2 && properties.length >= 1) {
            console.log('Creating test conversation...');

            const buyer = users.find(u => u.role === 'buyer') || users[0];
            const seller = users.find(u => u.role === 'seller') || users[1];
            const property = properties[0];

            // Create conversation
            const conversation = new Conversation({
                buyerId: buyer._id,
                sellerId: seller._id,
                propertyId: property._id,
                lastMessage: 'Hi, I am interested in this property.',
                lastSenderId: buyer._id
            });
            await conversation.save();
            console.log(`✓ Created conversation between ${buyer.name} and ${seller.name}`);

            // Create initial message
            const message = new Message({
                conversationId: conversation._id,
                senderId: buyer._id,
                senderRole: 'buyer',
                content: 'Hi, I am interested in this property.'
            });
            await message.save();
            console.log('✓ Created initial message\n');
        }

        // Final status
        const finalConvs = await Conversation.find().populate('buyerId sellerId propertyId');
        const finalMsgs = await Message.find();

        console.log('=== MESSAGING SYSTEM STATUS ===');
        console.log(`✓ Total Conversations: ${finalConvs.length}`);
        console.log(`✓ Total Messages: ${finalMsgs.length}`);

        if (finalConvs.length > 0) {
            console.log('\n📱 MESSAGING IS ACTIVE!');
            console.log('\nTest it now:');
            console.log('1. Go to http://localhost:5503/login.html');
            console.log('2. Login with any user credentials');
            console.log('3. Navigate to http://localhost:5503/messages.html');
            console.log('4. You should see your conversations!\n');

            console.log('Sample conversations:');
            finalConvs.forEach((conv, i) => {
                console.log(`  ${i + 1}. ${conv.buyerId.name} ↔ ${conv.sellerId.name}`);
                console.log(`     Property: ${conv.propertyId.title}`);
                console.log(`     Last: "${conv.lastMessage}"\n`);
            });
        } else {
            console.log('\n⚠ No conversations yet. Create one by:');
            console.log('1. Login as a buyer');
            console.log('2. Visit a property detail page');
            console.log('3. Click "Contact Seller"');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

activateMessaging();
