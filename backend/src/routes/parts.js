const express = require('express');
const auth = require('../middleware/auth');
const { searchParts } = require('../services/partsSearchService');
const { generateText } = require('../utils/gemini');
const { REGIONAL_SHOPPING_HINTS, getShoppingLocale } = require('../utils/marketLocations');

const router = express.Router();

// POST /api/parts/search — search for car parts
router.post('/search', auth, async (req, res, next) => {
  try {
    const { query, carMake, carModel, carYear, countryCode, source } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const market = getShoppingLocale(countryCode || 'US');
    const regionHint = REGIONAL_SHOPPING_HINTS[market.countryCode] || REGIONAL_SHOPPING_HINTS.US;
    const prompt = `Convert this car parts search into a specific Google Shopping query (max 12 words). ALWAYS include the exact year AND chassis code when known. Return ONLY the query, nothing else.

User request: "${query}"
${carMake ? `Car: ${carYear || ''} ${carMake} ${carModel || ''}`.trim() : ''}
Market country: ${market.label} (${market.countryCode}) — ${regionHint}

Rules:
- Always include year + make + model/chassis code
- Include the market country name "${market.label}" in the query so results match that region
- Prefer retailers and listings available in ${market.label}
- Use chassis codes for BMW (E39, E46, F30...), Mercedes (W211, W204...), etc.
- Year is critical — include it to avoid returning results for newer models

Examples:
"headlights" for 2003 BMW 540i → "2003 BMW 540i E39 headlights"
"black rims" for 2003 BMW 540i → "2003 BMW E39 black alloy wheels"
"sport rims" for 2015 BMW 320i → "2015 BMW 320i F30 sport alloy wheels"
"brake pads" for 2020 Toyota Camry → "2020 Toyota Camry brake pads"
"exhaust" for 2003 BMW 540i in Lebanon → "BMW E39 540i performance exhaust Lebanon"
"brake pads" for 2020 Toyota Camry in UAE → "2020 Toyota Camry brake pads UAE"`;

    let optimizedQuery = carMake
      ? `${carYear || ''} ${carMake} ${carModel || ''} ${query} ${market.label}`.trim()
      : `${query} ${market.label}`.trim();
    try {
      optimizedQuery = (await generateText(prompt))
        .trim()
        .replace(/^["']|["']$/g, '');
    } catch {
      // Gemini failed — use car-prefixed query as fallback
    }

    const search = await searchParts(optimizedQuery, countryCode || 'US');
    const parts = search.results;

    // Filter using optimized query words (which include car make/model) so generic parts are excluded
    const filterWords = optimizedQuery.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const relevant = parts.filter(p => {
      const title = (p.title || '').toLowerCase();
      return filterWords.some(w => title.includes(w));
    });

    const results = relevant.length > 0 ? relevant : parts;

    res.json({
      query: optimizedQuery,
      market: market.countryCode,
      marketLabel: market.label,
      source: search.provider,
      mockFallback: search.mockFallback,
      diagnostic: search.diagnostic,
      results,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
