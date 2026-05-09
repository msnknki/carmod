const axios = require('axios');

const GOOGLE_PLACES_KEY = process.env.GOOGLE_PLACES_API_KEY;

// Search for nearby auto parts shops using Google Places
async function searchNearbyShops(latitude, longitude, radius = 10000) {
  if (!GOOGLE_PLACES_KEY) {
    return getMockShops();
  }

  try {
    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/place/nearbysearch/json',
      {
        params: {
          location: `${latitude},${longitude}`,
          radius,
          keyword: 'auto parts car parts',
          type: 'store',
          key: GOOGLE_PLACES_KEY,
        },
      },
    );

    return response.data.results.slice(0, 15).map(place => ({
      id: place.place_id,
      name: place.name,
      address: place.vicinity,
      rating: place.rating || null,
      totalRatings: place.user_ratings_total || 0,
      isOpen: place.opening_hours?.open_now ?? null,
      latitude: place.geometry.location.lat,
      longitude: place.geometry.location.lng,
      source: 'google_places',
    }));
  } catch {
    return getMockShops();
  }
}

function getMockShops() {
  return [
    {
      id: 'mock_1',
      name: 'AutoZone',
      address: '123 Main St',
      rating: 4.2,
      totalRatings: 312,
      isOpen: true,
      latitude: 0,
      longitude: 0,
      source: 'mock',
    },
    {
      id: 'mock_2',
      name: "O'Reilly Auto Parts",
      address: '456 Oak Ave',
      rating: 4.4,
      totalRatings: 198,
      isOpen: true,
      latitude: 0,
      longitude: 0,
      source: 'mock',
    },
    {
      id: 'mock_3',
      name: 'NAPA Auto Parts',
      address: '789 Elm Blvd',
      rating: 4.1,
      totalRatings: 147,
      isOpen: false,
      latitude: 0,
      longitude: 0,
      source: 'mock',
    },
    {
      id: 'mock_4',
      name: 'Advance Auto Parts',
      address: '321 Pine Rd',
      rating: 3.9,
      totalRatings: 89,
      isOpen: true,
      latitude: 0,
      longitude: 0,
      source: 'mock',
    },
    {
      id: 'mock_5',
      name: 'Pep Boys',
      address: '654 Cedar Ln',
      rating: 3.7,
      totalRatings: 210,
      isOpen: null,
      latitude: 0,
      longitude: 0,
      source: 'mock',
    },
  ];
}

module.exports = { searchNearbyShops };
