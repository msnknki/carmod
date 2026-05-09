const { getPartsSource, EBAY_SUPPORTED_COUNTRIES } = require('../src/utils/shippingRegions');

describe('shippingRegions', () => {
  test('returns ebay for US', () => {
    expect(getPartsSource('US')).toBe('ebay');
  });

  test('returns ebay for UK', () => {
    expect(getPartsSource('GB')).toBe('ebay');
  });

  test('returns ebay for Germany', () => {
    expect(getPartsSource('DE')).toBe('ebay');
  });

  test('returns aliexpress for unsupported countries', () => {
    expect(getPartsSource('BD')).toBe('aliexpress');
    expect(getPartsSource('NG')).toBe('aliexpress');
    expect(getPartsSource('PK')).toBe('aliexpress');
  });

  test('is case-insensitive', () => {
    expect(getPartsSource('us')).toBe('ebay');
    expect(getPartsSource('Us')).toBe('ebay');
  });

  test('defaults to aliexpress for empty input', () => {
    expect(getPartsSource('')).toBe('aliexpress');
    expect(getPartsSource(undefined)).toBe('aliexpress');
  });

  test('EBAY_SUPPORTED_COUNTRIES is a Set', () => {
    expect(EBAY_SUPPORTED_COUNTRIES).toBeInstanceOf(Set);
    expect(EBAY_SUPPORTED_COUNTRIES.size).toBeGreaterThan(10);
  });
});
