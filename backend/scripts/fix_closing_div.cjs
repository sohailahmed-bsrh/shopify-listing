const fs = require('fs');
const filePath = 'ems_project/frontend/src/components/WhatsAppDashboard.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const needle = 'placeholder="Description / Condition"\r\n                                                        />                                                </div>';
const needleLF = 'placeholder="Description / Condition"\n                                                        />                                                </div>';

if (content.includes(needle)) {
    content = content.replace(
        needle,
        'placeholder="Description / Condition"\r\n                                                        />\r\n                                                    </div>'
    );
    // and after `                                        </div>\r\n                                    )}` add another closing div
    content = content.replace(
        '                                        </div>\r\n                                    )}\r\n\r\n                                    {/* Media Upload Tab */}',
        '                                        </div>\r\n                                        </div>\r\n                                    )}\r\n\r\n                                    {/* Media Upload Tab */}'
    );
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed CRLF closing divs!');
} else if (content.includes(needleLF)) {
    content = content.replace(
        needleLF,
        'placeholder="Description / Condition"\n                                                        />\n                                                    </div>'
    );
    content = content.replace(
        '                                        </div>\n                                    )}\n\n                                    {/* Media Upload Tab */}',
        '                                        </div>\n                                        </div>\n                                    )}\n\n                                    {/* Media Upload Tab */}'
    );
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed LF closing divs!');
} else {
    console.error('Needle not found!');
    process.exit(1);
}
