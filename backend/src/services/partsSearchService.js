const axios = require('axios');
const { getPartsSource } = require('../utils/shippingRegions');

// Map app country codes to Serper.dev gl (Google locale) codes
const COUNTRY_TO_GL = {
  LB: 'ae', // Lebanon has sparse Google Shopping; use UAE region for better coverage
  AE: 'ae',
  US: 'us',
  GB: 'gb',
  DE: 'de',
};

// Search Google Shopping via Serper.dev — returns real product images
async function searchSerper(query, countryCode, limit = 10) {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) {
    return null; // signal to caller to try next source
  }

  const gl = COUNTRY_TO_GL[countryCode] || 'us';

  try {
    const res = await axios.post(
      'https://google.serper.dev/shopping',
      { q: query, gl, num: limit },
      { headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' } },
    );

    const items = res.data?.shopping || [];
    if (items.length === 0) return null;

    return items.map((item, i) => {
      const priceRaw = item.price || '';
      const price = parseFloat(priceRaw.replace(/[^0-9.]/g, '')) || 0;
      return {
        id: `serper_${i}_${Date.now()}`,
        title: item.title || '',
        price,
        currency: 'USD',
        imageUrl: item.imageUrl || item.thumbnailUrl || '',
        url: item.link || '',
        condition: 'New',
        source: 'serper',
        sellerName: item.source || '',
        rating: item.rating || null,
        ratingCount: item.ratingCount || 0,
      };
    });
  } catch (err) {
    console.error('Serper API error:', err.response?.data || err.message);
    return null;
  }
}

// Search eBay Finding API (App ID only, no OAuth)
async function searchEbay(query, limit = 10) {
  const apiKey = process.env.EBAY_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await axios.get('https://svcs.ebay.com/services/search/FindingService/v1', {
      params: {
        'OPERATION-NAME': 'findItemsByKeywords',
        'SERVICE-VERSION': '1.0.0',
        'SECURITY-APPNAME': apiKey,
        'RESPONSE-DATA-FORMAT': 'JSON',
        'REST-PAYLOAD': true,
        keywords: query,
        'paginationInput.entriesPerPage': limit,
        'outputSelector': 'GalleryInfo',
        'sortOrder': 'BestMatch',
      },
      timeout: 8000,
    });

    const items = res.data?.findItemsByKeywordsResponse?.[0]?.searchResult?.[0]?.item || [];
    if (items.length === 0) return null;

    return items.map(item => {
      const thumbUrl = item.galleryURL?.[0] || '';
      const imageUrl = thumbUrl
        .replace('s-l140.', 's-l500.')
        .replace('s-l225.', 's-l500.');
      return {
        id: item.itemId?.[0],
        title: item.title?.[0],
        price: parseFloat(item.sellingStatus?.[0]?.currentPrice?.[0]?.__value__ || 0),
        currency: item.sellingStatus?.[0]?.currentPrice?.[0]?.['@currencyId'] || 'USD',
        imageUrl,
        url: item.viewItemURL?.[0],
        condition: item.condition?.[0]?.conditionDisplayName?.[0] || 'Used',
        source: 'ebay',
        sellerLocation: item.location?.[0] || '',
      };
    }).filter(item => item.imageUrl); // only keep items that have an image
  } catch (err) {
    console.error('eBay API error:', err.message);
    return null;
  }
}

// Search AliExpress Affiliate API
async function searchAliExpress(query, limit = 10) {
  const apiKey = process.env.ALIEXPRESS_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await axios.get('https://api-sg.aliexpress.com/sync', {
      params: {
        method: 'aliexpress.affiliate.product.query',
        app_key: apiKey,
        keywords: query,
        target_currency: 'USD',
        page_size: limit,
        category_ids: '204003587',
      },
      timeout: 8000,
    });

    const products = res.data?.aliexpress_affiliate_product_query_response?.resp_result?.result?.products?.product || [];
    if (products.length === 0) return null;

    return products.map(item => ({
      id: item.product_id?.toString(),
      title: item.product_title,
      price: parseFloat(item.target_sale_price || 0),
      currency: 'USD',
      imageUrl: item.product_main_image_url || '',
      url: item.promotion_link || item.product_detail_url,
      condition: 'New',
      source: 'aliexpress',
      sellerLocation: 'China',
    })).filter(item => item.imageUrl);
  } catch (err) {
    console.error('AliExpress API error:', err.message);
    return null;
  }
}

// Mock results for development (used when no API keys are configured)
function getMockResults(query, source = 'serper') {
  const keywords = query.toLowerCase();
  const mockData = [
    { name: 'Sport Alloy Wheels 18"', price: 189.99, condition: 'New', keywords: ['rim', 'wheel', 'alloy'], imgTag: 'alloy,wheel,rim' },
    { name: 'LED Headlight Assembly', price: 129.99, condition: 'New', keywords: ['headlight', 'led', 'light'], imgTag: 'headlight,led,car' },
    { name: 'Carbon Fiber Spoiler', price: 249.99, condition: 'New', keywords: ['spoiler', 'carbon', 'wing'], imgTag: 'spoiler,carbon,car' },
    { name: 'Performance Brake Kit', price: 299.99, condition: 'New', keywords: ['brake', 'pad', 'disc', 'rotor'], imgTag: 'brake,disc,rotor' },
    { name: 'Sport Exhaust Muffler', price: 179.99, condition: 'New', keywords: ['exhaust', 'muffler', 'pipe'], imgTag: 'exhaust,muffler,car' },
    { name: 'Leather Seat Covers Set', price: 89.99, condition: 'New', keywords: ['seat', 'leather', 'cover', 'interior'], imgTag: 'leather,seat,car,interior' },
    { name: 'Racing Steering Wheel', price: 159.99, condition: 'New', keywords: ['steering', 'wheel', 'racing'], imgTag: 'steering,wheel,racing' },
    { name: 'Cold Air Intake System', price: 139.99, condition: 'New', keywords: ['air', 'intake', 'filter', 'engine'], imgTag: 'intake,engine,car' },
    { name: 'Suspension Lowering Springs', price: 219.99, condition: 'New', keywords: ['suspension', 'spring', 'lower', 'coil'], imgTag: 'suspension,coilover,spring' },
    { name: 'Body Kit Side Skirts', price: 199.99, condition: 'New', keywords: ['body', 'kit', 'skirt', 'bumper'], imgTag: 'bodykit,bumper,car' },
  ];

  const matched = mockData.filter(item =>
    item.keywords.some(k => keywords.includes(k))
  );
  const pool = matched.length > 0 ? matched : mockData.slice(0, 6);

  return pool.map((item, i) => ({
    id: `mock_${source}_${i}_${Date.now()}`,
    title: item.name,
    price: item.price,
    currency: 'USD',
    imageUrl: `https://loremflickr.com/400/280/${item.imgTag}?lock=${i}`,
    url: `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(item.name)}`,
    condition: item.condition,
    source: 'mock',
    sellerLocation: '',
  }));
}

// Main search: Serper → eBay → AliExpress → mock
async function searchParts(query, countryCode, limit = 10) {
  // 1. Try Serper.dev (Google Shopping) — real images, works globally
  const serperResults = await searchSerper(query, countryCode, limit);
  if (serperResults && serperResults.length > 0) {
    return serperResults;
  }

  // 2. Try eBay Finding API
  const ebayResults = await searchEbay(query, limit);
  if (ebayResults && ebayResults.length > 0) {
    return ebayResults;
  }

  // 3. Try AliExpress Affiliate API
  const aliResults = await searchAliExpress(query, limit);
  if (aliResults && aliResults.length > 0) {
    return aliResults;
  }

  // 4. Fall back to mock data
  const source = getPartsSource(countryCode);
  return getMockResults(query, source);
}

module.exports = { searchParts, searchSerper, searchEbay, searchAliExpress };
