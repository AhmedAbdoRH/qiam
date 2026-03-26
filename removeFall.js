const fs = require('fs');
const path = 'src/components/SelfDialogueChat.tsx';
let content = fs.readFileSync(path, 'utf8');

console.log('Removing __FALL__ references...');

// Count matches before
const countBefore = (content.match(/__FALL__/g) || []).length;
console.log(`Found ${countBefore} __FALL__ references`);

// Remove the first __FALL__ block (getTodayConversation function, around line 423-428)
// This pattern matches the if block that handles __FALL__ messages
const pattern1 = /      if \(msg\.message\.startsWith\('__FALL__'\)\) \{\n        const content = msg\.message\.replace\('__FALL__\|', ''\);\n        const parts = content\.split\('\|'\);\n        const description = parts\[1\] \|\| '';\n        return `\[\$\{time\}\] [^\n]+ سقوط: \$\{description\}`;\n      \}\n      \n/;

content = content.replace(pattern1, '');
console.log('After removing first block: ' + (content.match(/__FALL__/g) || []).length + ' references remain');

// Remove the second __FALL__ rendering block in table (around line 2058-2082)
const pattern2 = /                            \/\/ Fall entry\n                            if \(m\.message\.startsWith\('__FALL__'\)\) \{[\s\S]*?\n                            \}\n\n                            \/\/ Milestone entry/;

content = content.replace(pattern2, '                            // Milestone entry');
console.log('After removing second block: ' + (content.match(/__FALL__/g) || []).length + ' references remain');

fs.writeFileSync(path, content, 'utf8');
console.log('File updated successfully');
