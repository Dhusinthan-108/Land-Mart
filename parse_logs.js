const fs = require('fs');

const logPath = 'server.log';
if (!fs.existsSync(logPath)) {
    console.log('server.log not found');
    process.exit(0);
}

const content = fs.readFileSync(logPath, 'utf8');
const lines = content.split('\n');

const filtered = lines.filter(line => line.includes('[API]')).slice(-20);

console.log('--- RECENT API LOGS ---');
filtered.forEach(line => console.log(line.trim()));
