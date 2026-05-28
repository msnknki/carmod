const { searchParts } = require('../src/services/partsSearchService');

describe('partsSearchService (mock mode)', () => {
  test('returns results for a general query', async () => {
    const { results, provider } = await searchParts('brake pads', 'US');
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
    expect(provider).toBeDefined();
  });

  test('results have required fields', async () => {
    const { results } = await searchParts('spoiler', 'US');
    for (const part of results) {
      expect(part).toHaveProperty('id');
      expect(part).toHaveProperty('title');
      expect(part).toHaveProperty('price');
      expect(typeof part.price).toBe('number');
      expect(part).toHaveProperty('source');
    }
  });

  test('filters by keyword when available', async () => {
    const { results } = await searchParts('exhaust', 'US');
    const hasRelevant = results.some(r =>
      (r.title || '').toLowerCase().includes('exhaust'),
    );
    expect(hasRelevant).toBe(true);
  });

  test('returns mock results for aliexpress region', async () => {
    const { results } = await searchParts('rims', 'BD');
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
  });
});
