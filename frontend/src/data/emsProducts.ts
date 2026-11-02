import { EMSProduct } from '../types';

export const INITIAL_EMS_PRODUCTS: EMSProduct[] = [
  {
    id: '5',
    title: 'Nike Air Zoom',
    sku: 'EMS-0005',
    category: 'Nike unisex',
    price: 5000,
    compare_at_price: 4500,
    starting_price: '5000.00',
    minimum_price: '4500.00',
    stock: 25,
    status: 'active',
    image: 'https://bmn8ocxpqcwj.compat.objectstorage.ap-mumbai-1.oraclecloud.com/devsil-ems-product-listing/prod_images_1790273666124_9ekq79.jpg',
    extra_images: [],
    video_url: 'https://bmn8ocxpqcwj.compat.objectstorage.ap-mumbai-1.oraclecloud.com/devsil-ems-product-listing/prod_video_1790273666325_enf280.mp4',
    voice_note_url: 'https://bmn8ocxpqcwj.compat.objectstorage.ap-mumbai-1.oraclecloud.com/devsil-ems-product-listing/prod_voice_note_1792740823178_by9qe8.ogg',
    vendor: 'Nike',
    description: 'Brand: Nike | Color: white | Size: 42',
    tags: ['Nike', 'unisex', 'white', 'EMS'],
    brand: 'Nike',
    gender: 'unisex',
    color: 'white',
    size: '42',
    variantsCount: 1,
    shopify_product_id: null,
    shopify_url: null
  }
];

export function getProductsByIds(ids: string[]): EMSProduct[] {
  // Preserve exact selection order!
  const map = new Map(INITIAL_EMS_PRODUCTS.map(p => [p.id, p]));
  const result: EMSProduct[] = [];
  for (const id of ids) {
    const p = map.get(id);
    if (p) result.push(p);
  }
  return result;
}
