const express = require('express');
const db = require('../config/database');
const auth = require('../middleware/auth');
const { generateText } = require('../utils/gemini');

const router = express.Router();

const DIY_SYSTEM_PROMPT = `You are an expert car mechanic AI. Your primary goal is to EMPOWER the user to diagnose and fix their own car. Only recommend a workshop as a last resort.

PHILOSOPHY:
- Always try to diagnose first. Never say "see a mechanic" without first walking the user through what to check.
- Even vague symptoms get actionable steps — cover the most common causes.
- A workshop is the last step, not the first suggestion.

WORKSHOP RULES (only recommend when truly required):
- Airbag / SRS system work → always workshop
- Active fuel leak or fire risk → always workshop
- Issues confirmed to require dealer-specific scanner programming (e.g. key fob pairing, ECU flashing) → workshop
- Everything else (brakes, suspension, engine noise, warning lights, AC, vibration) → provide DIY steps first. Only set workshopRecommended:true if the DIY steps conclude that the failure is internal and requires professional disassembly.

CLARIFYING QUESTIONS:
- If the symptom is vague (e.g. "engine problem", "strange noise") and specific details would significantly change the approach, include 2-3 targeted questions in clarifyingQuestions.
- Questions must be specific: "Does the noise happen at idle or only while driving?" not "Tell me more."
- Always still provide diagnosis and steps even when asking questions — never return empty steps.

STEPS QUALITY:
- Steps must be self-diagnostic: tell the user what to physically check, what they will see/hear, and what it means.
- Include "If you find X, then Y is the cause. Do Z to fix it."
- Be specific about car parts and locations.

Respond ONLY with valid JSON (no markdown, no code fences):
{
  "diagnosis": "Description of the most likely cause(s)",
  "confidence": "high|medium|low",
  "difficulty": "easy|moderate|hard|professional",
  "estimatedTime": "e.g. 30 minutes, 1-2 hours",
  "tools": ["tool1", "tool2"],
  "steps": ["Detailed step 1", "Detailed step 2"],
  "safetyWarnings": ["warning if relevant"],
  "workshopRecommended": false,
  "workshopReason": "",
  "estimatedCost": {"parts": "$XX-$XX", "labor": "$XX-$XX"},
  "clarifyingQuestions": ["Question 1?", "Question 2?"]
}`;

// POST /api/diy — diagnose a car problem
router.post('/', auth, async (req, res, next) => {
  try {
    const { symptom, carId, additionalContext } = req.body;

    if (!symptom) {
      return res.status(400).json({ error: 'Symptom description is required' });
    }

    // Get car context
    let carContext = '';
    if (carId) {
      const car = db.prepare('SELECT * FROM cars WHERE id = ? AND user_id = ?').get(carId, req.userId);
      if (car) {
        carContext = `\nUser's car: ${car.year} ${car.make} ${car.model}`;
      }
    }

    const followUp = additionalContext ? `\n\nUser follow-up details: ${additionalContext}` : '';
    const prompt = `${DIY_SYSTEM_PROMPT}${carContext}\n\nUser's problem: ${symptom}${followUp}`;

    const text = await generateText(prompt);

    // Parse JSON response
    let diagnosis;
    try {
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      diagnosis = JSON.parse(cleaned);
    } catch {
      diagnosis = {
        diagnosis: text,
        confidence: 'low',
        difficulty: 'unknown',
        estimatedTime: 'Unknown',
        tools: [],
        steps: [text],
        safetyWarnings: [],
        workshopRecommended: false,
        workshopReason: '',
        estimatedCost: { parts: 'Unknown', labor: 'Unknown' },
        clarifyingQuestions: [],
      };
    }

    // Save as a DIY conversation
    const conv = db.prepare(
      'INSERT INTO conversations (user_id, car_id, type, title) VALUES (?, ?, ?, ?)'
    ).run(req.userId, carId || null, 'diy', symptom.substring(0, 50));

    db.prepare(
      'INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)'
    ).run(conv.lastInsertRowid, 'user', symptom);

    db.prepare(
      'INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)'
    ).run(conv.lastInsertRowid, 'ai', JSON.stringify(diagnosis));

    res.json(diagnosis);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
