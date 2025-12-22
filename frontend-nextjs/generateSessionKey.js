// generateSessionKey.js
const { generatePrivateKey, privateKeyToAddress } = require('viem/accounts');

const privateKey = generatePrivateKey();
const address = privateKeyToAddress(privateKey);

console.log('Private Key:', privateKey);
console.log('Address:', address);