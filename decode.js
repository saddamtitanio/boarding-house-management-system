const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, 'dump.sql');
const outputPath = path.join(__dirname, 'dump_utf8.sql');

try {
  const content = fs.readFileSync(inputPath, 'utf16le');
  fs.writeFileSync(outputPath, content, 'utf8');
  console.log('Successfully decoded dump.sql to dump_utf8.sql in UTF-8 format.');
} catch (err) {
  console.error('Error decoding file:', err);
}
