const fs = require('fs');
const filePath = 'ems_project/frontend/src/components/WhatsAppDashboard.tsx';
let raw = fs.readFileSync(filePath, 'utf8');
const isCRLF = raw.includes('\r\n');
let lines = raw.split(/\r?\n/);

// Remove extra div from mobile form (around line 3334)
const mobileIdx = lines.findIndex((l, i) => i < 3500 && l.includes('placeholder="Description / Condition"'));
console.log('Mobile textarea at line:', mobileIdx + 1);

// Look at the lines after mobileIdx until `activeMobilePage === 'add-product-media'`
// In mobile form:
// lines[mobileIdx] ends with `</div>` (closing bg-[#18181b] for details)
// then `</div>` (closing space-y-4 Details & Taxonomy)
// then `</div>` (closing flex-1 overflow-y-auto)
// then `</div>` (closing w-full h-full md:max-w-xl)
// then `</div>` (closing md:hidden flex flex-col...)
// then `)}`
// Let's inspect what lines[mobileIdx ... mobileIdx+8] are:
console.log('Mobile after textarea:', lines.slice(mobileIdx, mobileIdx + 8));

// Let's check desktop textarea
const deskIdx = lines.findIndex((l, i) => i > 3500 && l.includes('placeholder="Description / Condition"'));
console.log('Desktop textarea at line:', deskIdx + 1);
console.log('Desktop after textarea:', lines.slice(deskIdx, deskIdx + 8));

// In mobile form, we added an extra `</div>` at mobileIdx + 5. Let's remove it if it's there:
if (lines[mobileIdx + 5].trim() === '</div>' && lines[mobileIdx + 6].trim() === ')}') {
    lines.splice(mobileIdx + 5, 1);
    console.log('Removed extra mobile closing div');
}

// Re-find deskIdx
const newDeskIdx = lines.findIndex((l, i) => i > 3500 && l.includes('placeholder="Description / Condition"'));
// Desk lines:
// newDeskIdx: placeholder="Description / Condition"
// newDeskIdx + 1: `                                                        />`
// newDeskIdx + 2: `                                                    </div>` (closes bg-[#18181b])
// newDeskIdx + 3: `                                            </div>` (closes right col space-y-4)
// newDeskIdx + 4: `                                        </div>` (closes grid)
// Now we need `                                        </div>` to close `space-y-6`!
lines.splice(newDeskIdx + 5, 0, '                                        </div>');
console.log('Added missing desktop closing div');

const sep = isCRLF ? '\r\n' : '\n';
fs.writeFileSync(filePath, lines.join(sep), 'utf8');
console.log('Done!');
