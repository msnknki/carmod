const express = require('express');
const auth = require('../middleware/auth');
const { searchNearbyShops } = require('../services/localShopsService');

const router = express.Router();

// GET /api/shops/nearby — find local auto parts shops
router.get('/nearby', auth, async (req, res, next) => {
  try {
    const { latitude, longitude, radius } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'latitude and longitude are required' });
    }

    const shops = await searchNearbyShops(
      parseFloat(latitude),
      parseFloat(longitude),
      radius ? parseInt(radius, 10) : undefined,
    );

    res.json({ results: shops });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
