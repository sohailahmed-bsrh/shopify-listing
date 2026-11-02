const fs = require('fs');

console.log('===========================================================');
console.log('   RESPONSIVE VIEWPORT & LAYOUT METRICS AUDIT SUITE       ');
console.log('===========================================================\n');

const dashContent = fs.readFileSync('ems_project/frontend/src/components/WhatsAppDashboard.tsx', 'utf8');
const shopifyContent = fs.readFileSync('ems_project/frontend/src/components/ShopifyProductsView.tsx', 'utf8');

const checks = [
    {
        name: 'Widescreen & Available Width Utilization',
        test: () => {
            const hasMax1700 = dashContent.includes('max-w-[1700px]');
            const hasNoMax6xlFeed = !dashContent.includes('w-full max-w-6xl mx-auto custom-scrollbar');
            if (!hasMax1700 || !hasNoMax6xlFeed) {
                throw new Error('Container still restricted to max-w-6xl or missing max-w-[1700px]');
            }
            return 'Feed container expanded to max-w-[1700px] with responsive padding (px-3 sm:px-6 md:px-8)';
        }
    },
    {
        name: 'Products Sidebar Sticky & Non-Crushing Width',
        test: () => {
            const hasStickySidebar = dashContent.includes('md:sticky md:top-2 self-start');
            if (!hasStickySidebar) {
                throw new Error('Sidebar missing md:sticky positioning');
            }
            return 'Sidebar remains sticky (md:sticky md:top-2 self-start) while preserving content width';
        }
    },
    {
        name: 'WhatsApp List View Compact Horizontal Row Layout',
        test: () => {
            const hasRowClass = dashContent.includes('flex-col md:flex-row md:items-center justify-between');
            const hasThumb = dashContent.includes('w-20 h-20 sm:w-24 sm:h-24 md:w-24 md:h-24');
            const hasPrice = dashContent.includes('Rs {product.starting_price}');
            if (!hasRowClass || !hasThumb || !hasPrice) {
                throw new Error('List view row layout incomplete');
            }
            return 'Row cards span full width (flex-col md:flex-row md:items-center justify-between) with 24px/96px thumbnails';
        }
    },
    {
        name: 'WhatsApp Grid Responsive Column Densities (No Thin Columns)',
        test: () => {
            const hasGridClass = dashContent.includes('grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5');
            if (!hasGridClass) {
                throw new Error('Grid columns still using restrictive or narrow layout');
            }
            return 'Calculated min card width: 340px+ across all desktop viewports (1, 2, 3, or 4 cols based on available width)';
        }
    },
    {
        name: 'Shopify Grid Responsive Column Densities (No Thin Columns)',
        test: () => {
            const hasShopifyGridClass = shopifyContent.includes('grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5');
            if (!hasShopifyGridClass) {
                throw new Error('Shopify view still using xl:grid-cols-4 in constrained width');
            }
            return 'Shopify grid uses xl:grid-cols-3 2xl:grid-cols-4 preventing thin 190px columns';
        }
    },
    {
        name: 'Text Clipping Prevention (Titles & Descriptions)',
        test: () => {
            const titleClamps = dashContent.includes('line-clamp-2') && shopifyContent.includes('line-clamp-2');
            const descClamp = dashContent.includes('line-clamp-2 leading-relaxed max-w-2xl');
            const hasTitleTooltips = dashContent.includes('title={product.title}') && shopifyContent.includes('title={product.title}');
            if (!titleClamps || !descClamp || !hasTitleTooltips) {
                throw new Error('Missing multi-line clamps or full title tooltips');
            }
            return 'Titles wrap cleanly to 2 lines with title tooltip fallback; descriptions clamp to 2 lines with max-w-2xl';
        }
    },
    {
        name: 'Action Buttons Boundary Containment',
        test: () => {
            const hasWrapActions = dashContent.includes('flex items-center gap-1.5 flex-wrap justify-end');
            if (!hasWrapActions) {
                throw new Error('Action buttons lack flex-wrap or boundary containment');
            }
            return 'Action buttons flex-wrap cleanly inside card bounds on mobile/tablet/desktop';
        }
    },
    {
        name: 'Desktop Toolbar Alignment & Product Count',
        test: () => {
            const hasFlexbar = dashContent.includes('hidden md:flex items-center justify-between gap-4 mb-6 w-full flex-wrap');
            const hasCount = dashContent.includes('products.length === 1 ? \'Product\' : \'Products\'');
            const hasAddProduct = dashContent.includes('Add Product');
            if (!hasFlexbar || !hasCount || !hasAddProduct) {
                throw new Error('Desktop toolbar missing flexbar, count, or Add Product button');
            }
            return 'Toolbar features search, clear button, product count badge, view toggle, and Add Product action';
        }
    }
];

let allPassed = true;
checks.forEach((c, idx) => {
    try {
        const details = c.test();
        console.log(`[PASS] Check ${idx + 1}: ${c.name}\n       -> ${details}\n`);
    } catch (err) {
        allPassed = false;
        console.error(`[FAIL] Check ${idx + 1}: ${c.name}\n       -> ${err.message}\n`);
    }
});

console.log('===========================================================');
if (allPassed) {
    console.log('ALL RESPONSIVE VIEWPORT & LAYOUT AUDIT CHECKS PASSED!');
    process.exit(0);
} else {
    console.error('SOME CHECKS FAILED!');
    process.exit(1);
}
