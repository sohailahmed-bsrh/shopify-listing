const fs = require('fs');

const file = process.argv[2] || 'ems_project/frontend/src/components/WhatsAppDashboard.tsx';
const query = process.argv[3] || 'add-product';

const content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');

console.log(`Searching for "${query}" in ${file} (${lines.length} lines)...`);
lines.forEach((line, idx) => {
    if (line.toLowerCase().includes(query.toLowerCase())) {
        console.log(`${idx + 1}: ${line.trim().substring(0, 120)}`);
    }
});
