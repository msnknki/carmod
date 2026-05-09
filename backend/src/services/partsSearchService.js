const axios = require('axios');
const { getPartsSource } = require('../utils/shippingRegions');

// Search eBay Browse API
async function searchEbay(query, limit = 10) {
  const apiKey = process.env.EBAY_API_KEY;
  if (!apiKey) {
    return getMockResults(query, 'ebay');
  }

  try {
    const res = await axios.get('https://api.ebay.com/buy/browse/v1/item_summary/search', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      params: {
        q: query,
        limit,
        category_ids: '6030', // Auto parts category
      },
    });

    return (res.data.itemSummaries || []).map(item => ({
      id: item.itemId,
      name: item.title,
      price: parseFloat(item.price?.value || 0),
      currency: item.price?.currency || 'USD',
      imageUrl: item.image?.imageUrl || '',
      purchaseUrl: item.itemWebUrl,
      condition: item.condition || 'Unknown',
      source: 'ebay',
      sellerLocation: item.itemLocation?.country || '',
    }));
  } catch (err) {
    console.error('eBay API error:', err.message);
    return getMockResults(query, 'ebay');
  }
}

// Search AliExpress Affiliate API
async function searchAliExpress(query, limit = 10) {
  const apiKey = process.env.ALIEXPRESS_API_KEY;
  if (!apiKey) {
    return getMockResults(query, 'aliexpress');
  }

  try {
    const res = await axios.get('https://api-sg.aliexpress.com/sync', {
      params: {
        method: 'aliexpress.affiliate.product.query',
        app_key: apiKey,
        keywords: query,
        target_currency: 'USD',
        page_size: limit,
        category_ids: '204003587', // Auto parts
      },
    });

    const products = res.data?.aliexpress_affiliate_product_query_response?.resp_result?.result?.products?.product || [];
    return products.map(item => ({
      id: item.product_id?.toString(),
      name: item.product_title,
      price: parseFloat(item.target_sale_price || 0),
      currency: 'USD',
      imageUrl: item.product_main_image_url || '',
      purchaseUrl: item.promotion_link || item.product_detail_url,
      condition: 'New',
      source: 'aliexpress',
      sellerLocation: 'China',
    }));
  } catch (err) {
    console.error('AliExpress API error:', err.message);
    return getMockResults(query, 'aliexpress');
  }
}

// Mock results for development (used when API keys are not configured)
function getMockResults(query, source) {
  const keywords = query.toLowerCase();
  const parts = [];
  const mockData = [
    { name: 'Sport Alloy Wheels 18"', price: 189.99, condition: 'New', keywords: ['rim', 'wheel', 'alloy'] },
    { name: 'LED Headlight Assembly', price: 129.99, condition: 'New', keywords: ['headlight', 'led', 'light'] },
    { name: 'Carbon Fiber Spoiler', price: 249.99, condition: 'New', keywords: ['spoiler', 'carbon', 'wing'] },
    { name: 'Performance Brake Kit', price: 299.99, condition: 'New', keywords: ['brake', 'pad', 'disc', 'rotor'] },
    { name: 'Sport Exhaust Muffler', price: 179.99, condition: 'New', keywords: ['exhaust', 'muffler', 'pipe'] },
    { name: 'Leather Seat Covers Set', price: 89.99, condition: 'New', keywords: ['seat', 'leather', 'cover', 'interior'] },
    { name: 'Racing Steering Wheel', price: 159.99, condition: 'New', keywords: ['steering', 'wheel', 'racing'] },
    { name: 'Body Kit Side Skirts', price: 199.99, condition: 'New', keywords: ['body', 'kit', 'skirt', 'bumper'] },
    { name: 'HID Xenon Light Kit', price: 69.99, condition: 'New', keywords: ['hid', 'xenon', 'light', 'bulb'] },
    { name: 'Cold Air Intake System', price: 139.99, condition: 'New', keywords: ['air', 'intake', 'filter', 'engine'] },
    { name: 'Suspension Lowering Springs', price: 219.99, condition: 'New', keywords: ['suspension', 'spring', 'lower', 'coil'] },
    { name: 'Chrome Door Handle Covers', price: 29.99, condition: 'New', keywords: ['chrome', 'door', 'handle', 'trim'] },
  ];

  // Filter by relevance to search query, or return all if no specific match
  const matched = mockData.filter(item =>
    item.keywords.some(k => keywords.includes(k))
  );
  const results = matched.length > 0 ? matched : mockData.slice(0, 6);

  return results.map((item, i) => ({
    id: `mock_${source}_${i}_${Date.now()}`,
    name: item.name,
    price: source === 'aliexpress' ? Math.round(item.price * 0.6 * 100) / 100 : item.price,
    currency: 'USD',
    imageUrl: '',
    purchaseUrl: source === 'ebay'
      ? `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(item.name)}`
      : `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(item.name)}`,
    condition: item.condition,
    source,
    sellerLocation: source === 'ebay' ? 'US' : 'China',
  }));
}

// Main search function — picks source based on country
async function searchParts(query, countryCode, limit = 10) {
  const source = getPartsSource(countryCode);
  if (source === 'ebay') {
    return searchEbay(query, limit);
  }
  return searchAliExpress(query, limit);
}

module.exports = { searchParts, searchEbay, searchAliExpress };
