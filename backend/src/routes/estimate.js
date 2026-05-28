const express = require('express');
const auth = require('../middleware/auth');
const { generateText } = require('../utils/gemini');

const router = express.Router();

// POST /api/estimate — get cost estimation for modifications or repairs
router.post('/', auth, async (req, res, next) => {
  try {
    const { carMake, carModel, carYear, modifications, region } = req.body;

    if (!modifications || modifications.length === 0) {
      return res.status(400).json({ error: 'At least one modification or repair item is required' });
    }

    const carStr = [carYear, carMake, carModel].filter(Boolean).join(' ') || 'a car';
    const modsStr = modifications.map((m, i) => `${i + 1}. ${typeof m === 'string' ? m : m.title || m.name}`).join('\n');

    const prompt = `You are an automotive cost estimation expert. Provide a detailed cost breakdown for the following modifications/repairs on ${carStr}.
${region ? `Region: ${region}` : ''}

Items:
${modsStr}

Respond ONLY with valid JSON in this exact format:
{
  "items": [
    {
      "name": "item name",
      "partsCostLow": 50,
      "partsCostHigh": 100,
      "laborCostLow": 30,
      "laborCostHigh": 80,
      "laborHours": "1-2",
      "notes": "any important notes"
    }
  ],
  "totalPartsCostLow": 50,
  "totalPartsCostHigh": 100,
  "totalLaborCostLow": 30,
  "totalLaborCostHigh": 80,
  "grandTotalLow": 80,
  "grandTotalHigh": 180,
  "currency": "USD",
  "disclaimer": "brief disclaimer about estimates"
}

All costs in USD. Be realistic with current market prices.`;

    let text = (await generateText(prompt)).trim();

    // Strip markdown code fences if present
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');

    const estimate = JSON.parse(text);
    res.json(estimate);
  } catch (err) {
    if (err instanceof SyntaxError) {
      return res.status(502).json({ error: 'Failed to parse cost estimate from AI' });
    }
    next(err);
  }
});

module.exports = router;
