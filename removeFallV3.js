const fs = require('fs');
const path = 'src/components/SelfDialogueChat.tsx';
const lines = fs.readFileSync(path, 'utf8').split('\n');

console.log(`Total lines: ${lines.length}`);

const newLines = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const nextLine = i + 1 < lines.length ? lines[i + 1] : '';
  const nextTwoLines = i + 2 < lines.length ? lines[i + 2] : '';
  
  // Skip the first __FALL__ block (getTodayConversation, around line 423-429)
  // Check if this is the start of the block
  if (
    line.includes("if (msg.message.startsWith('__FALL__'))") &&
    nextLine.includes("const content = msg.message.replace('__FALL__|',") &&
    nextTwoLines.includes("const parts = content.split('|')")
  ) {
    console.log(`Skipping __FALL__ block 1 at line ${i + 1}`);
    // Skip 6 lines: if statement, const content, const parts, const description, return, }
    i += 6;
    // Also skip the blank line after
    if (i + 1 < lines.length && lines[i + 1].trim() === '') {
      i++;
    }
    continue;
  }
  
  // Skip the second __FALL__ block (table rendering, around line 2058)
  // First find the // Fall entry comment
  if (line.includes("// Fall entry")) {
    console.log(`Found Fall entry comment at line ${i + 1}`);
    // Next line should be the if statement
    if (nextLine.includes("if (m.message.startsWith('__FALL__'))")) {
      console.log(`Skipping __FALL__ block 2 - from line ${i + 1} to...`);
      
      // Skip until we find the closing }
      let braceDepth = 0;
      let startI = i;
      i++; // Start from the if line
      
      while (i < lines.length) {
        const countOpen = (lines[i].match(/\{/g) || []).length;
        const countClose = (lines[i].match(/\}/g) || []).length;
        braceDepth += countOpen - countClose;
        
        if (braceDepth === 0 && lines[i].includes('}')) {
          console.log(`  Found closing brace at line ${i + 1}`);
          break;
        }
        i++;
      }
      
      // Skip the closing } line
      if (i < lines.length && lines[i].includes('}')) {
        i++;
      }
      
      // Skip blank lines after
      while (i < lines.length &&lines[i].trim() === '') {
        i++;
      }
      
      console.log(`  Skipped until line ${i + 1}`);
      continue;
    }
  }
  
  newLines.push(line);
}

fs.writeFileSync(path, newLines.join('\n'), 'utf8');
console.log(`Written ${newLines.length} lines`);

// Check remaining
const content = fs.readFileSync(path, 'utf8');
const remaining = (content.match(/__FALL__/g) || []).length;
console.log(`Remaining __FALL__ references: ${remaining}`);
