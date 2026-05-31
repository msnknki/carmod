const MARKETS = {
  LB: {label: 'Lebanon', latitude: 33.8938, longitude: 35.5018},
  AE: {label: 'UAE', latitude: 25.2048, longitude: 55.2708},
  US: {label: 'USA', latitude: 37.7749, longitude: -122.4194},
  GB: {label: 'UK', latitude: 51.5074, longitude: -0.1278},
  DE: {label: 'Germany', latitude: 52.52, longitude: 13.405},
};

const SHOPPING_LOCALE = {

  LB: {
    gl: 'lb',
    hl: 'en',
    location: 'Beirut, Lebanon',
    fallbackGl: 'ae',
    fallbackLocation: 'Dubai, United Arab Emirates',
  },
  AE: {gl: 'ae', hl: 'en', location: 'Dubai, United Arab Emirates'},
  US: {gl: 'us', hl: 'en', location: 'United States'},
  GB: {gl: 'gb', hl: 'en', location: 'United Kingdom'},
  DE: {gl: 'de', hl: 'de', location: 'Germany'},
};

function getMarket(code) {
  return MARKETS[code?.toUpperCase()] || MARKETS.US;
}

function getShoppingLocale(countryCode) {
  const code = countryCode?.toUpperCase() || 'US';
  const market = getMarket(code);
  const locale = SHOPPING_LOCALE[code] || SHOPPING_LOCALE.US;
  return {
    countryCode: code,
    label: market.label,
    ...locale,
  };
}

const REGIONAL_SHOPPING_HINTS = {
  LB: 'Lebanon — prefer local retailers (Midas, Autobacs Lebanon area sellers, Dubizzle Lebanon, OLX Lebanon, regional auto parts stores)',
  AE: 'UAE — Dubizzle, Amazon.ae automotive, Noon, local performance shops in Dubai/Abu Dhabi',
  US: 'USA — Amazon, eBay, AutoZone, RockAuto, Summit Racing',
  GB: 'UK — eBay UK, Euro Car Parts, Halfords, Amazon UK',
  DE: 'Germany — eBay DE, Autodoc, Amazon DE',
};

module.exports = {
  MARKETS,
  getMarket,
  getShoppingLocale,
  REGIONAL_SHOPPING_HINTS,
};
