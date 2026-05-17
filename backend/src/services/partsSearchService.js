const axios = require('axios');
const { getPartsSource } = require('../utils/shippingRegions');

// Search eBay Finding API (uses App ID directly, no OAuth needed)
async function searchEbay(query, limit = 10) {
  const apiKey = process.env.EBAY_API_KEY;
  if (!apiKey) {
    return getMockResults(query, 'ebay');
  }

  try {
    const res = await axios.get('https://svcs.ebay.com/services/search/FindingService/v1', {
      params: {
        'OPERATION-NAME': 'findItemsByKeywords',
        'SERVICE-VERSION': '1.0.0',
        'SECURITY-APPNAME': apiKey,
        'RESPONSE-DATA-FORMAT': 'JSON',
        'REST-PAYLOAD': true,
        keywords: query,
        'categoryId': '6030',
        'paginationInput.entriesPerPage': limit,
        'outputSelector': 'GalleryInfo',
        'sortOrder': 'BestMatch',
      },
    });

    const items = res.data?.findItemsByKeywordsResponse?.[0]?.searchResult?.[0]?.item || [];
    return items.map(item => {
      const thumbUrl = item.galleryURL?.[0] || '';
      const imageUrl = thumbUrl.replace('s-l140.', 's-l500.');
      return {
        id: item.itemId?.[0],
        name: item.title?.[0],
        price: parseFloat(item.sellingStatus?.[0]?.currentPrice?.[0]?.__value__ || 0),
        currency: item.sellingStatus?.[0]?.currentPrice?.[0]?.['@currencyId'] || 'USD',
        imageUrl,
        purchaseUrl: item.viewItemURL?.[0],
        condition: item.condition?.[0]?.conditionDisplayName?.[0] || 'Used',
        source: 'ebay',
        sellerLocation: item.location?.[0] || '',
      };
    });
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
    { name: 'Sport Alloy Wheels 18"', price: 189.99, condition: 'New', keywords: ['rim', 'wheel', 'alloy'], imgTag: 'alloy,wheel,rim' },
    { name: 'LED Headlight Assembly', price: 129.99, condition: 'New', keywords: ['headlight', 'led', 'light'], imgTag: 'headlight,led,car' },
    { name: 'Carbon Fiber Spoiler', price: 249.99, condition: 'New', keywords: ['spoiler', 'carbon', 'wing'], imgTag: 'spoiler,carbon,car' },
    { name: 'Performance Brake Kit', price: 299.99, condition: 'New', keywords: ['brake', 'pad', 'disc', 'rotor'], imgTag: 'brake,disc,rotor' },
    { name: 'Sport Exhaust Muffler', price: 179.99, condition: 'New', keywords: ['exhaust', 'muffler', 'pipe'], imgTag: 'exhaust,muffler,car' },
    { name: 'Leather Seat Covers Set', price: 89.99, condition: 'New', keywords: ['seat', 'leather', 'cover', 'interior'], imgTag: 'leather,seat,car,interior' },
    { name: 'Racing Steering Wheel', price: 159.99, condition: 'New', keywords: ['steering', 'wheel', 'racing'], imgTag: 'steering,wheel,racing' },
    { name: 'Body Kit Side Skirts', price: 199.99, condition: 'New', keywords: ['body', 'kit', 'skirt', 'bumper'], imgTag: 'bodykit,bumper,car' },
    { name: 'HID Xenon Light Kit', price: 69.99, condition: 'New', keywords: ['hid', 'xenon', 'light', 'bulb'], imgTag: 'xenon,headlight,car' },
    { name: 'Cold Air Intake System', price: 139.99, condition: 'New', keywords: ['air', 'intake', 'filter', 'engine'], imgTag: 'intake,engine,car' },
    { name: 'Suspension Lowering Springs', price: 219.99, condition: 'New', keywords: ['suspension', 'spring', 'lower', 'coil'], imgTag: 'suspension,coilover,spring' },
    { name: 'Chrome Door Handle Covers', price: 29.99, condition: 'New', keywords: ['chrome', 'door', 'handle', 'trim'], imgTag: 'chrome,door,handle,car' },
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
    imageUrl: `https://loremflickr.com/400/280/${item.imgTag}?lock=${i}`,
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
