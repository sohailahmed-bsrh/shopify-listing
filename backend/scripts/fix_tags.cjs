const fs = require('fs');
const file = 'c:/Users/BILAL.COM/Desktop/shopify_listing/ems_project/frontend/src/components/WhatsAppDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetLines = `                                    )}
                                </div>
                                        </div>
                                    )}
                                </div>
                            )}`;

const fixedLines = `                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}`;

// Let's inspect exact lines 2425 to 2435
const lines = content.split(/\r?\n/);
console.log("Lines 2427-2435:", lines.slice(2427, 2436));

// Look for the block around line 2430
const idx = lines.findIndex((l, i) => i > 2420 && i < 2440 && l.includes("</div>") && lines[i+1]?.includes("</div>"));
console.log("Found at idx:", idx);
if (idx !== -1) {
    console.log("Context around idx:", lines.slice(idx - 2, idx + 5));
    // Replace lines from idx to idx + 3
    lines.splice(idx, 4, 
        "                                        </div>",
        "                                    )}",
        "                                </div>",
        "                            </div>",
        "                        )}");
    fs.writeFileSync(file, lines.join('\n'), 'utf8');
    console.log("SUCCESS: Adjusted closing tags in WhatsAppDashboard.tsx");
}
