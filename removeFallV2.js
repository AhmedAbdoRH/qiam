const fs = require('fs');
const path = 'src/components/SelfDialogueChat.tsx';
const lines = fs.readFileSync(path, 'utf8').split('\n');

console.log('Processing file...');
const newLines = [];
let i = 0;

while (i < lines.length) {
  const line = lines[i];
  
  // Check for the __FALL__ if block in getTodayConversation (line 423)
  if (line.includes("if (msg.message.startsWith('__FALL__'))")) {
    console.log(`Found __FALL__ block at line ${i + 1}, removing...`);
    
    // Skip the if block (should be about 5-7 lines)
    // Skip until we find the closing brace followed by a blank line and another if statement
    let braceCount = 0;
    let foundClosing = false;
    
    while (i < lines.length) {
      if (lines[i].includes('{')) braceCount++;
      if (lines[i].includes('}')) braceCount--;
      
      if (braceCount === 0 && foundClosing) {
        // Skip blank line after the closing brace if it exists
        if (i + 1 < lines.length && lines[i + 1].trim() === '') {
          i++; // Skip blank line
        }
        i++; // Move past the closing brace
        break;
      }
      
      if (braceCount === 0 && !foundClosing && lines[i].includes('}')) {
        foundClosing = true;
        i++;
        break;
      }
      
      i++;
    }
    continue;
  }
  
  // Check for the Fall entry rendering block in table (line 2058)
  if (line.includes("// Fall entry") && i + 1 < lines.length && lines[i + 1].includes("if (m.message.startsWith('__FALL__'))")) {
    console.log(`Found Fall rendering block at line ${i + 1}, removing...`);
    
    i++; // Skip the comment line
    
    // Skip the if block until we find the closing brace before "// Milestone entry"
    let braceCount = 0;
    let foundClosing = false;
    
    while (i < lines.length) {
      if (lines[i].includes('{')) braceCount++;
      if (lines[i].includes('}')) {
        braceCount--;
        if (braceCount === 0) {
          foundClosing = true;
        }
      }
      
      i++;
      
      if (foundClosing) {
        // Skip blank line after the closing brace if it exists
        if (i < lines.length && lines[i].trim() === '') {
          i++;
        }
        break;
      }
    }
    continue;
  }
  
  newLines.push(line);
  i++;
}

fs.writeFileSync(path, newLines.join('\n'), 'utf8');
console.log('Done! Removed __FALL__ blocks');

// Verify
const content = fs.readFileSync(path, 'utf8');
const remaining = (content.match(/__FALL__/g) || []).length;
console.log(`Remaining __FALL__ references: ${remaining}`);
