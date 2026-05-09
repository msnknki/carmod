const express = require('express');
const auth = require('../middleware/auth');
const { generateModifiedCarImage, buildPrompt } = require('../services/replicateService');

const router = express.Router();

// POST /api/image/generate — generate a modified car image
router.post('/generate', auth, async (req, res, next) => {
  try {
    const { carMake, carModel, carYear, parts, description, imageUrl } = req.body;

    if (!carMake && !description) {
      return res.status(400).json({ error: 'Provide car info or a description' });
    }

    const prompt = buildPrompt({ carMake, carModel, carYear, parts, description });

    const result = await generateModifiedCarImage({ prompt, imageUrl });

    res.json({
      prompt,
      ...result,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
