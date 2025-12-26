const https = require('https');
const fs = require('fs');
const path = require('path');

const files = [
  'draco_decoder.js',
  'draco_decoder.wasm',
  'draco_wasm_wrapper.js',
  'draco_decoder.wasm.js',
  'draco_decoder.wasm.wasm'
];

const baseUrl = 'https://www.gstatic.com/draco/versioned/decoders/1.5.6/';

const destDir = path.join(__dirname, '../frontend/public/draco');
if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

files.forEach(file => {
  const fileUrl = baseUrl + file;
  const destPath = path.join(destDir, file);
  https.get(fileUrl, res => {
    res.pipe(fs.createWriteStream(destPath));
    console.log(`Downloaded ${file}`);
  });
});
