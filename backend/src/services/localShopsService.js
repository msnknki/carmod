const axios = require('axios');
const { getMarket } = require('../utils/marketLocations');

const GOOGLE_PLACES_KEY = process.env.GOOGLE_PLACES_API_KEY;

function mapsUrlFor(place) {
  if (place.place_id) {
    return `https://www.google.com/maps/place/?q=place_id:${place.place_id}`;
  }
  if (place.latitude != null && place.longitude != null) {
    return `https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.name} ${place.address}`)}`;
}

// Search for nearby auto parts shops using Google Places
async function searchNearbyShops(latitude, longitude, radius = 12000, countryCode = 'US') {
  if (!GOOGLE_PLACES_KEY) {
    return getMockShops(latitude, longitude, countryCode);
  }

  try {
    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/place/nearbysearch/json',
      {
        params: {
          location: `${latitude},${longitude}`,
          radius,
          keyword: 'auto parts car repair mechanic',
          type: 'car_repair',
          key: GOOGLE_PLACES_KEY,
        },
      },
    );

    return response.data.results.slice(0, 15).map(place => {
      const lat = place.geometry.location.lat;
      const lng = place.geometry.location.lng;
      const mapped = {
        id: place.place_id,
        name: place.name,
        address: place.vicinity || place.formatted_address || '',
        rating: place.rating || null,
        totalRatings: place.user_ratings_total || 0,
        isOpen: place.opening_hours?.open_now ?? null,
        latitude: lat,
        longitude: lng,
        source: 'google_places',
      };
      mapped.mapsUrl = mapsUrlFor({ ...mapped, place_id: place.place_id });
      return mapped;
    });
  } catch {
    return getMockShops(latitude, longitude, countryCode);
  }
}

function getMockShops(latitude, longitude, countryCode) {
  const market = getMarket(countryCode);
  const catalogs = {
    LB: [
      { name: 'Midas Lebanon', address: 'Beirut — auto service' },
      { name: 'Car Parts Lebanon', address: 'Hamra, Beirut' },
      { name: 'Garage 961 Performance', address: 'Jounieh highway' },
      { name: 'OLX Auto Parts Hub', address: 'Greater Beirut' },
    ],
    AE: [
      { name: 'AutoPro UAE', address: 'Al Quoz, Dubai' },
      { name: 'Performance Zone Garage', address: 'Sheikh Zayed Rd, Dubai' },
      { name: 'Noon Automotive Hub', address: 'Abu Dhabi' },
      { name: 'Dubizzle Motors Partner', address: 'Sharjah' },
    ],
    US: [
      { name: 'AutoZone', address: '123 Main St' },
      { name: "O'Reilly Auto Parts", address: '456 Oak Ave' },
      { name: 'NAPA Auto Parts', address: '789 Elm Blvd' },
      { name: 'Advance Auto Parts', address: '321 Pine Rd' },
    ],
    GB: [
      { name: 'Halfords Autocentre', address: 'Central London' },
      { name: 'Euro Car Parts', address: 'Manchester Rd' },
      { name: 'Kwik Fit', address: 'Birmingham' },
      { name: 'ATS Euromaster', address: 'Leeds' },
    ],
    DE: [
      { name: 'ATU Auto Teile', address: 'Berlin Mitte' },
      { name: 'Autodoc Partner Garage', address: 'Hamburg' },
      { name: 'Bosch Car Service', address: 'Munich' },
      { name: 'Hella Service Partner', address: 'Frankfurt' },
    ],
  };

  const list = catalogs[countryCode?.toUpperCase()] || catalogs.US;

  return list.map((shop, i) => {
    const lat = latitude + (i * 0.002);
    const lng = longitude + (i * 0.002);
    const mapped = {
      id: `mock_${countryCode}_${i}`,
      name: shop.name,
      address: `${shop.address} · ${market.label}`,
      rating: 4 + (i % 3) * 0.1,
      totalRatings: 80 + i * 25,
      isOpen: i % 2 === 0,
      latitude: lat,
      longitude: lng,
      source: 'mock',
    };
    mapped.mapsUrl = mapsUrlFor(mapped);
    return mapped;
  });
}

module.exports = { searchNearbyShops };
