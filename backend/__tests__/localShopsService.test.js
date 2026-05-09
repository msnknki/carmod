const { searchNearbyShops } = require('../src/services/localShopsService');

describe('localShopsService (mock mode)', () => {
  test('returns mock shops when no API key is set', async () => {
    const shops = await searchNearbyShops(37.7749, -122.4194);
    expect(Array.isArray(shops)).toBe(true);
    expect(shops.length).toBeGreaterThan(0);
  });

  test('shop objects have required fields', async () => {
    const shops = await searchNearbyShops(0, 0);
    for (const shop of shops) {
      expect(shop).toHaveProperty('id');
      expect(shop).toHaveProperty('name');
      expect(shop).toHaveProperty('address');
      expect(shop).toHaveProperty('rating');
      expect(shop).toHaveProperty('source');
    }
  });

  test('mock shops have expected names', async () => {
    const shops = await searchNearbyShops(0, 0);
    const names = shops.map(s => s.name);
    expect(names).toContain('AutoZone');
    expect(names).toContain('NAPA Auto Parts');
  });
});
