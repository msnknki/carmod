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
    const prompt = `Convert this car parts search request into an optimized product search query. Return ONLY the search query text, nothing else.

User request: "${query}"
${carMake ? `Car: ${carYear || ''} ${carMake} ${carModel || ''}`.trim() : ''}

Example: "I want sporty rims" for a 2015 BMW 320i → "aftermarket sport alloy rims wheels 18 inch BMW 3 series F30 2015"`;

    let optimizedQuery = query;
    try {
      const result = await model.generateContent(prompt);
      optimizedQuery = result.response.text().trim().replace(/^["']|["']$/g, '');
    } catch {
      // Fall back to original query if Gemini fails
    }

    const parts = await searchParts(optimizedQuery, countryCode || 'US');

    res.json({
      query: optimizedQuery,
      source: parts.length > 0 ? parts[0].source : (source || 'ebay'),
      results: parts,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
