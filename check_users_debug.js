const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function checkUsers() {
    try {
        const mongoURI = process.env.DB_HOST || 'mongodb://localhost:27017/landmart';
        await mongoose.connect(mongoURI);
        console.log('Connected to MongoDB');

        const users = await User.find({}, 'name email password role');
        console.log('--- Users in Database ---');
        users.forEach(user => {
            console.log(`Name: ${user.name}`);
            console.log(`Email: ${user.email}`);
            console.log(`Password: ${user.password}`);
            console.log(`Role: ${user.role}`);
            console.log('-------------------------');
        });

        await mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkUsers();
