const fs = require('fs');
const lines = fs.readFileSync('ems_project/frontend/src/components/WhatsAppDashboard.tsx', 'utf8').split(/\r?\n/);
lines.forEach((l, idx) => {
    if (l.includes('placeholder="Description / Condition"')) {
        console.log('Textarea at line:', idx + 1);
        for (let j = idx - 1; j <= idx + 8; j++) {
            if (lines[j]) console.log('  ' + (j + 1) + ': ' + lines[j]);
        }
    }
});
