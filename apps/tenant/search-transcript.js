const fs = require('fs');
const path = require('path');

const logPath = 'C:\\Users\\Saddam Titanio\\.gemini\\antigravity\\brain\\5f0e52f3-a658-473c-81ba-bb1add2507b9\\.system_generated\\logs\\transcript.jsonl';

try {
  const content = fs.readFileSync(logPath, 'utf8');
  const lines = content.split('\n');
  console.log('Total log lines:', lines.length);

  const keywords = ['room/page.tsx', 'rooms page', 'tenant app'];
  let matchesCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    
    // Check if any keyword matches
    const hasKeyword = keywords.some(k => line.toLowerCase().includes(k.toLowerCase()));
    if (hasKeyword) {
      matchesCount++;
      try {
        const obj = JSON.parse(line);
        console.log(`\n--- Match #${matchesCount} (Line ${i}) ---`);
        console.log('Type:', obj.type);
        console.log('Source:', obj.source);
        if (obj.content) {
          // Output first 300 chars of content
          console.log('Content:', obj.content.substring(0, 500) + '...');
        } else if (obj.tool_calls) {
          console.log('Tool Calls:', JSON.stringify(obj.tool_calls).substring(0, 500));
        }
      } catch (err) {
        // Not JSON
        console.log(`Line ${i} matches, but is not valid JSON.`);
      }
    }
    if (matchesCount >= 20) {
      console.log('\nReached limit of 20 matches.');
      break;
    }
  }
} catch (err) {
  console.error('Error reading transcript log:', err.message);
}
