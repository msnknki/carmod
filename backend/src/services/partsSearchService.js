const axios = require('axios');
const { getPartsSource } = require('../utils/shippingRegions');
const { readEnv } = require('../utils/env');
const { getShoppingLocale } = require('../utils/marketLocations');

function parsePriceAndCurrency(priceRaw) {
  const text = String(priceRaw || '');
  const price = parseFloat(text.replace(/[^0-9.]/g, '')) || 0;
  if (/AED|د\.إ/i.test(text)) return {price, currency: 'AED'};
  if (/€|EUR/i.test(text)) return {price, currency: 'EUR'};
  if (/£|GBP/i.test(text)) return {price, currency: 'GBP'};
  if (/\$|USD/i.test(text)) return {price, currency: 'USD'};
  return {price, currency: 'USD'};
}

let lastSearchDiagnostic = null;

function setDiagnostic(message) {
  lastSearchDiagnostic = message;
}

function getSearchDiagnostic() {
  return lastSearchDiagnostic;
}

async function searchSerper(query, countryCode, limit = 10) {
  const apiKey = readEnv('SERPER_API_KEY');
  if (!apiKey) {
    setDiagnostic(
      'SERPER_API_KEY is not set on the server. In Render, use exactly: SERPER_API_KEY (not SERPER_KEY).',
    );
    return null;
  }

  const locale = getShoppingLocale(countryCode);

  const fetchShopping = async (gl, hl, location) => {
    const res = await axios.post(
      'https://google.serper.dev/shopping',
      {q: query, gl, hl, location, num: limit},
      {headers: {'X-API-KEY': apiKey, 'Content-Type': 'application/json'}, timeout: 12000},
    );
    return res.data?.shopping || [];
  };

  try {
    let items = await fetchShopping(locale.gl, locale.hl, locale.location);

    if (items.length === 0 && locale.fallbackGl) {
      items = await fetchShopping(
        locale.fallbackGl,
        locale.hl,
        locale.fallbackLocation || locale.location,
      );
    }

    if (items.length === 0) {
      setDiagnostic('Serper returned no shopping results for this query.');
      return null;
    }

    setDiagnostic(null);
    return items.map((item, i) => {
      const {price, currency} = parsePriceAndCurrency(item.price);
      return {
        id: `serper_${i}_${Date.now()}`,
        title: item.title || '',
        price,
        currency,
        market: locale.countryCode,
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
    const detail = err.response?.data?.message || err.response?.data || err.message;
    console.error('Serper API error:', detail);
    if (err.response?.status === 401 || err.response?.status === 403) {
      setDiagnostic(
        'Serper API key is invalid or expired. Create a new key at serper.dev and set SERPER_API_KEY on Render.',
      );
    } else {
      setDiagnostic(`Serper request failed: ${typeof detail === 'string' ? detail : 'unknown error'}`);
    }
    return null;
  }
}

async function searchEbay(query, limit = 10) {
  const apiKey = readEnv('EBAY_API_KEY');
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
    }).filter(item => item.imageUrl);
  } catch (err) {
    console.error('eBay API error:', err.message);
    return null;
  }
}

async function searchAliExpress(query, limit = 10) {
  const apiKey = readEnv('ALIEXPRESS_API_KEY');
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

async function searchParts(query, countryCode, limit = 10) {
  lastSearchDiagnostic = null;

  const serperResults = await searchSerper(query, countryCode, limit);
  if (serperResults && serperResults.length > 0) {
    return { results: serperResults, provider: 'serper', mockFallback: false, diagnostic: null };
  }

  const ebayResults = await searchEbay(query, limit);
  if (ebayResults && ebayResults.length > 0) {
    return { results: ebayResults, provider: 'ebay', mockFallback: false, diagnostic: null };
  }

  const aliResults = await searchAliExpress(query, limit);
  if (aliResults && aliResults.length > 0) {
    return { results: aliResults, provider: 'aliexpress', mockFallback: false, diagnostic: null };
  }

  const source = getPartsSource(countryCode);
  const diagnostic =
    lastSearchDiagnostic ||
    'No parts API keys configured. Add SERPER_API_KEY (recommended) on Render.';
  return {
    results: getMockResults(query, source),
    provider: 'mock',
    mockFallback: true,
    diagnostic,
  };
}

module.exports = {
  searchParts,
  searchSerper,
  searchEbay,
  searchAliExpress,
  getSearchDiagnostic,
};
