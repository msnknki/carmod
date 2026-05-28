const MARKETS = {
  LB: {label: 'Lebanon', latitude: 33.8938, longitude: 35.5018},
  AE: {label: 'UAE', latitude: 25.2048, longitude: 55.2708},
  US: {label: 'USA', latitude: 37.7749, longitude: -122.4194},
  GB: {label: 'UK', latitude: 51.5074, longitude: -0.1278},
  DE: {label: 'Germany', latitude: 52.52, longitude: 13.405},
};

function getMarket(code) {
  return MARKETS[code?.toUpperCase()] || MARKETS.US;
}

const REGIONAL_SHOPPING_HINTS = {
  LB: 'Lebanon — prefer local retailers (Midas, Autobacs Lebanon area sellers, Dubizzle Lebanon, OLX Lebanon, regional auto parts stores)',
  AE: 'UAE — Dubizzle, Amazon.ae automotive, Noon, local performance shops in Dubai/Abu Dhabi',
  US: 'USA — Amazon, eBay, AutoZone, RockAuto, Summit Racing',
  GB: 'UK — eBay UK, Euro Car Parts, Halfords, Amazon UK',
  DE: 'Germany — eBay DE, Autodoc, Amazon DE',
};

module.exports = { MARKETS, getMarket, REGIONAL_SHOPPING_HINTS };
