const fs = require('fs');
const dashContent = fs.readFileSync('ems_project/frontend/src/components/WhatsAppDashboard.tsx', 'utf8');
const modalContent = fs.readFileSync('ems_project/frontend/src/components/ShopifyProductModal.tsx', 'utf8');

const vals = {
    dashHasSwatches: dashContent.includes('COLOR_SWATCHES.map'),
    dashHasGender: dashContent.includes("['men', 'women', 'unisex', 'kids'].map"),
    dashHasStock: dashContent.includes('formData.stock'),
    dashHasReviewBanner: dashContent.includes('Review Speech Fields') || dashContent.includes('Review Extracted Fields'),
    modalHasSwatches: modalContent.includes('COLOR_SWATCHES.map'),
    modalHasGender: modalContent.includes('Target Gender') && (modalContent.includes("['men', 'women', 'unisex', 'kids']") || modalContent.includes("{ id: 'men'")),
    modalHasStock: modalContent.includes('stock: e.target.value') || modalContent.includes('stock: parseInt'),
    modalHasReviewBanner: modalContent.includes('Review Speech Fields') || modalContent.includes('Extracted Fields Review')
};

console.log(vals);
