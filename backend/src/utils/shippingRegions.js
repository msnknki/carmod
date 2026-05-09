// Countries where eBay has reliable shipping infrastructure
const EBAY_SUPPORTED_COUNTRIES = new Set([
  'US', 'GB', 'DE', 'FR', 'IT', 'ES', 'AU', 'CA', 'AT', 'BE', 'CH', 'NL',
  'IE', 'PL', 'SE', 'DK', 'FI', 'NO', 'PT', 'CZ', 'HU', 'RO', 'BG', 'HR',
  'SK', 'SI', 'LT', 'LV', 'EE', 'JP', 'KR', 'SG', 'HK', 'TW', 'TH', 'MY',
  'PH', 'IN', 'NZ', 'ZA', 'IL', 'AE', 'SA', 'MX', 'BR', 'AR', 'CL', 'CO',
]);

function getPartsSource(countryCode) {
  if (!countryCode) {
    return 'aliexpress';
  }
  return EBAY_SUPPORTED_COUNTRIES.has(countryCode.toUpperCase()) ? 'ebay' : 'aliexpress';
}

module.exports = { getPartsSource, EBAY_SUPPORTED_COUNTRIES };
