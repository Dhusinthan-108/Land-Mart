const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Simple .env parser to avoid dependency issues in this environment
const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length === 2) env[parts[0].trim()] = parts[1].trim();
});
const mongoUri = env.DB_HOST;

async function diagnose() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('Connected.');

        const Property = require('./models/Property');

        const startTime = Date.now();
        const count = await Property.countDocuments();
        const endTime = Date.now();
        console.log(`Total properties in DB: ${count}`);
        console.log(`countDocuments took: ${endTime - startTime}ms`);

        const fetchStart = Date.now();
        const properties = await Property.find().populate('ownerId', 'name email').lean();
        const fetchEnd = Date.now();
        console.log(`Fetching all properties (with lean and populate) took: ${fetchEnd - fetchStart}ms`);

        if (properties.length > 0) {
            const sizeInBytes = Buffer.byteLength(JSON.stringify(properties));
            console.log(`Total payload size: ${(sizeInBytes / 1024 / 1024).toFixed(2)} MB`);
        }

        process.exit(0);
    } catch (error) {
        console.error('Diagnosis failed:', error);
        process.exit(1);
    }
}

diagnose();
