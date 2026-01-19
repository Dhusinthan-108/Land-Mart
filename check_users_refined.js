const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function checkUsers() {
    try {
        const mongoURI = process.env.DB_HOST || 'mongodb://localhost:27017/landmart';
        await mongoose.connect(mongoURI);

        const users = await User.find({}, 'name email password role');
        console.log(JSON.stringify(users, null, 2));

        await mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkUsers();
