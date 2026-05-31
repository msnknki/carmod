const express = require('express');
const auth = require('../middleware/auth');
const { searchNearbyShops } = require('../services/localShopsService');
const { getMarket } = require('../utils/marketLocations');

const router = express.Router();

router.get('/nearby', auth, async (req, res, next) => {
  try {
    let { latitude, longitude, radius, countryCode } = req.query;

    const market = getMarket(countryCode);
    if (!latitude || !longitude) {
      latitude = market.latitude;
      longitude = market.longitude;
    }

    const shops = await searchNearbyShops(
      parseFloat(latitude),
      parseFloat(longitude),
      radius ? parseInt(radius, 10) : undefined,
      countryCode,
    );

    res.json({ results: shops, market: market.label });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
