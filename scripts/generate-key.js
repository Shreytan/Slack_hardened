const crypto = require('crypto');

const key = crypto.randomBytes(32).toString('base64');
console.log('Generated encryption key:', key);
console.log('\nAdd this to your .env file:');
console.log(`ENCRYPTION_KEY=${key}`);
