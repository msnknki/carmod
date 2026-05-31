const express = require('express');
const auth = require('../middleware/auth');
const { generateModifiedCarImage, buildPrompt } = require('../services/replicateService');

const router = express.Router();

router.post('/generate', auth, async (req, res, next) => {
  try {
    const { carMake, carModel, carYear, parts, description, imageUrl, refine } = req.body;

    if (!carMake && !description) {
      return res.status(400).json({ error: 'Provide car info or a description' });
    }

    const hasReferenceImage = Boolean(imageUrl);
    const prompt = buildPrompt({
      carMake,
      carModel,
      carYear,
      parts,
      description,
      hasReferenceImage,
      isRefinement: refine === true,
    });

    const result = await generateModifiedCarImage({ prompt, imageUrl });

    res.json({
      prompt,
      usedReferenceImage: hasReferenceImage,
      ...result,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
