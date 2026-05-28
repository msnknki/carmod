const express = require('express');
const auth = require('../middleware/auth');
const { searchParts } = require('../services/partsSearchService');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { REGIONAL_SHOPPING_HINTS } = require('../utils/marketLocations');

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// POST /api/parts/search — search for car parts
router.post('/search', auth, async (req, res, next) => {
  try {
    const { query, carMake, carModel, carYear, countryCode, source } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    // Use Gemini to generate an optimized search query
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
    const regionHint = REGIONAL_SHOPPING_HINTS[countryCode?.toUpperCase()] || REGIONAL_SHOPPING_HINTS.US;
    const prompt = `Convert this car parts search into a specific search query (max 10 words). ALWAYS include the exact year AND chassis code when known. Return ONLY the query, nothing else.

User request: "${query}"
${carMake ? `Car: ${carYear || ''} ${carMake} ${carModel || ''}`.trim() : ''}
Market: ${countryCode || 'US'} — ${regionHint}

Rules:
- Always include year + make + model/chassis code
- Use chassis codes for BMW (E39, E46, F30...), Mercedes (W211, W204...), etc.
- Year is critical — include it to avoid returning results for newer models

Examples:
"headlights" for 2003 BMW 540i → "2003 BMW 540i E39 headlights"
"black rims" for 2003 BMW 540i → "2003 BMW E39 black alloy wheels"
"sport rims" for 2015 BMW 320i → "2015 BMW 320i F30 sport alloy wheels"
"brake pads" for 2020 Toyota Camry → "2020 Toyota Camry brake pads"
"exhaust" for 2003 BMW 540i → "BMW E39 540i performance exhaust"`;

    let optimizedQuery = carMake ? `${carYear || ''} ${carMake} ${carModel || ''} ${query}`.trim() : query;
    try {
      const result = await model.generateContent(prompt);
      optimizedQuery = result.response.text().trim().replace(/^["']|["']$/g, '');
    } catch {
      // Gemini failed — use car-prefixed query as fallback
    }

    const parts = await searchParts(optimizedQuery, countryCode || 'US');

    // Filter using optimized query words (which include car make/model) so generic parts are excluded
    const filterWords = optimizedQuery.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const relevant = parts.filter(p => {
      const title = (p.title || '').toLowerCase();
      return filterWords.some(w => title.includes(w));
    });

    const results = relevant.length > 0 ? relevant : parts;

    res.json({
      query: optimizedQuery,
      source: results.length > 0 ? results[0].source : 'serper',
      results,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
