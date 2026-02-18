const mongoose = require('mongoose');
require('dotenv').config();

const mongoURI = process.env.DB_HOST || 'mongodb://localhost:27017/landmart';

mongoose.connect(mongoURI)
    .then(async () => {
        console.log('Connected to MongoDB');
        const users = await mongoose.connection.db.collection('users').find().toArray();
        console.log('Users found:', users.length);
        users.forEach(u => console.log(`- ${u.name} (${u.email}) ID: ${u._id}`));
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
