const express = require('express');
const auth = require('../middleware/auth');
const { searchParts } = require('../services/partsSearchService');
const { GoogleGenerativeAI } = require('@google/generative-ai');

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
    const prompt = `Convert this car parts search into a short eBay search query (max 6 words). Focus on part type and car compatibility. Return ONLY the query, nothing else.

User request: "${query}"
${carMake ? `Car: ${carYear || ''} ${carMake} ${carModel || ''}`.trim() : ''}

Examples:
"I want sporty rims" for 2015 BMW 320i → "BMW 320i sport alloy wheels"
"aggressive headlights" for 2003 BMW 540i → "BMW 540i E39 headlights"
"black rims" for 2003 BMW 540i → "BMW E39 black alloy wheels"`;

    let optimizedQuery = query;
    try {
      const result = await model.generateContent(prompt);
      optimizedQuery = result.response.text().trim().replace(/^["']|["']$/g, '');
    } catch {
      // Fall back to original query if Gemini fails
    }

    const parts = await searchParts(optimizedQuery, countryCode || 'US');

    // Filter out results where none of the original search words appear in the title
    const searchWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const relevant = parts.filter(p => {
      const title = (p.title || '').toLowerCase();
      return searchWords.some(w => title.includes(w));
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
