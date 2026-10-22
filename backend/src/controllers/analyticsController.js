import { getDb } from '../config/db.js';

export async function getDashboardStats(req, res) {
  const db = getDb();

  if (db.isLive()) {
    try {
      const [[{ total_listings }]] = await db.pool().query('SELECT COUNT(*) as total_listings FROM listings');
      const [[{ synced_listings }]] = await db.pool().query("SELECT COUNT(*) as synced_listings FROM listings WHERE sync_status = 'synced'");
      const [[{ draft_listings }]] = await db.pool().query("SELECT COUNT(*) as draft_listings FROM listings WHERE sync_status = 'draft'");
      const [[{ failed_listings }]] = await db.pool().query("SELECT COUNT(*) as failed_listings FROM listings WHERE sync_status = 'failed'");
      const [[{ total_stores }]] = await db.pool().query('SELECT COUNT(*) as total_stores FROM shopify_stores');

      // Category breakdown
      const [categoryRows] = await db.pool().query(`
        SELECT COALESCE(NULLIF(category, ''), 'Uncategorized') as category, COUNT(*) as count
        FROM listings
        GROUP BY category
        ORDER BY count DESC
        LIMIT 6
      `);

      // Recent listings
      const [recentListings] = await db.pool().query(`
        SELECT l.id, l.title, l.sync_status, l.price, l.created_at, l.shopify_url, s.name as store_name
        FROM listings l
        LEFT JOIN shopify_stores s ON l.store_id = s.id
        ORDER BY l.created_at DESC
        LIMIT 8
      `);

      const syncRate = total_listings > 0 ? Math.round((synced_listings / total_listings) * 100) : 100;

      return res.json({
        success: true,
        stats: {
          total_listings,
          synced_listings,
          draft_listings,
          failed_listings,
          total_stores,
          syncRate,
          categoryDistribution: categoryRows,
          recentListings
        }
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // Fallback memory stats
  const total_listings = db.memory.listings.length;
  const synced_listings = db.memory.listings.filter(l => l.sync_status === 'synced').length;
  const draft_listings = db.memory.listings.filter(l => l.sync_status === 'draft').length;
  const failed_listings = db.memory.listings.filter(l => l.sync_status === 'failed').length;
  const total_stores = db.memory.stores.length;
  const syncRate = total_listings > 0 ? Math.round((synced_listings / total_listings) * 100) : 100;

  // Category map
  const catMap = {};
  db.memory.listings.forEach(l => {
    const cat = l.category || 'General';
    catMap[cat] = (catMap[cat] || 0) + 1;
  });
  const categoryDistribution = Object.keys(catMap).map(k => ({ category: k, count: catMap[k] }));

  return res.json({
    success: true,
    stats: {
      total_listings,
      synced_listings,
      draft_listings,
      failed_listings,
      total_stores,
      syncRate,
      categoryDistribution: categoryDistribution.length ? categoryDistribution : [
        { category: 'Apparel', count: 4 },
        { category: 'Electronics', count: 3 },
        { category: 'Accessories', count: 2 }
      ],
      recentListings: db.memory.listings.slice(0, 8)
    }
  });
}
