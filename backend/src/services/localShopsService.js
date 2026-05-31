const axios = require('axios');
const { getMarket } = require('../utils/marketLocations');

const GOOGLE_PLACES_KEY = process.env.GOOGLE_PLACES_API_KEY;

const MOCK_SHOP_IMAGES = [
  'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=640&q=80',
  'https://images.unsplash.com/photo-1625048838542-eda79a31a8ee?w=640&q=80',
  'https://images.unsplash.com/photo-1487754183091-3a6c164bd154?w=640&q=80',
  'https://images.unsplash.com/photo-1619642751034-765df43d7749?w=640&q=80',
];

function mapsUrlFor(place) {
  const lat = place.latitude;
  const lng = place.longitude;
  if (lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng)) {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }
  const label = `${place.name || ''} ${place.address || ''}`.trim();
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(label || 'auto parts')}`;
}

function placePhotoUrl(photoReference, maxWidth = 520) {
  if (!photoReference || !GOOGLE_PLACES_KEY) {
    return null;
  }
  return (
    'https://maps.googleapis.com/maps/api/place/photo?' +
    `maxwidth=${maxWidth}&photo_reference=${encodeURIComponent(photoReference)}` +
    `&key=${GOOGLE_PLACES_KEY}`
  );
}

function baseFromNearby(place) {
  const lat = place.geometry.location.lat;
  const lng = place.geometry.location.lng;
  const photoRef = place.photos?.[0]?.photo_reference;
  const mapped = {
    id: place.place_id,
    name: place.name,
    address: place.vicinity || place.formatted_address || '',
    rating: place.rating ?? null,
    totalRatings: place.user_ratings_total || 0,
    isOpen: place.opening_hours?.open_now ?? null,
    latitude: lat,
    longitude: lng,
    phone: null,
    website: null,
    hoursSummary: null,
    imageUrl: placePhotoUrl(photoRef),
    source: 'google_places',
    place_id: place.place_id,
  };
  mapped.mapsUrl = mapsUrlFor(mapped);
  return mapped;
}

async function enrichPlaceDetails(shop) {
  if (!GOOGLE_PLACES_KEY || !shop.place_id) {
    return shop;
  }

  try {
    const { data } = await axios.get(
      'https://maps.googleapis.com/maps/api/place/details/json',
      {
        params: {
          place_id: shop.place_id,
          fields:
            'formatted_address,formatted_phone_number,website,opening_hours,photos,rating,user_ratings_total',
          key: GOOGLE_PLACES_KEY,
        },
        timeout: 10000,
      },
    );

    const result = data.result;
    if (!result) {
      return shop;
    }

    const photoRef = result.photos?.[0]?.photo_reference;
    const weekday = result.opening_hours?.weekday_text;
    const hoursSummary = weekday?.length
      ? weekday.slice(0, 2).join(' · ')
      : shop.isOpen === true
        ? 'Open now'
        : shop.isOpen === false
          ? 'Closed now'
          : null;

    const enriched = {
      ...shop,
      address: result.formatted_address || shop.address,
      phone: result.formatted_phone_number || null,
      website: result.website || null,
      rating: result.rating ?? shop.rating,
      totalRatings: result.user_ratings_total ?? shop.totalRatings,
      hoursSummary,
      imageUrl: placePhotoUrl(photoRef) || shop.imageUrl,
    };
    enriched.mapsUrl = mapsUrlFor(enriched);
    return enriched;
  } catch {
    return shop;
  }
}

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

    const places = (response.data.results || []).slice(0, 12);
    const base = places.map(baseFromNearby);
    const enriched = await Promise.all(base.map(enrichPlaceDetails));
    return enriched.map(({ place_id, ...rest }) => rest);
  } catch {
    return getMockShops(latitude, longitude, countryCode);
  }
}

function getMockShops(latitude, longitude, countryCode) {
  const market = getMarket(countryCode);
  const catalogs = {
    LB: [
      {
        name: 'Midas Lebanon',
        address: 'Beirut, Lebanon',
        phone: '+961 1 234 567',
        hours: 'Mon–Sat 8:00–18:00',
      },
      {
        name: 'Car Parts Lebanon',
        address: 'Hamra, Beirut, Lebanon',
        phone: '+961 1 345 678',
        hours: 'Mon–Fri 9:00–19:00',
      },
      {
        name: 'Garage 961 Performance',
        address: 'Jounieh Highway, Lebanon',
        phone: '+961 9 876 543',
        hours: 'Daily 9:00–20:00',
      },
      {
        name: 'OLX Auto Parts Hub',
        address: 'Greater Beirut, Lebanon',
        website: 'https://www.olx.com.lb',
        hours: 'Online listings',
      },
    ],
    AE: [
      {
        name: 'AutoPro UAE',
        address: 'Al Quoz, Dubai, UAE',
        phone: '+971 4 123 4567',
        hours: 'Sat–Thu 8:00–20:00',
      },
      {
        name: 'Performance Zone Garage',
        address: 'Sheikh Zayed Rd, Dubai, UAE',
        phone: '+971 4 987 6543',
        hours: 'Daily 9:00–21:00',
      },
      {
        name: 'Noon Automotive Hub',
        address: 'Abu Dhabi, UAE',
        website: 'https://www.noon.com',
        hours: 'Online',
      },
      {
        name: 'Dubizzle Motors Partner',
        address: 'Sharjah, UAE',
        website: 'https://www.dubizzle.com',
        hours: 'Online',
      },
    ],
    US: [
      {
        name: 'AutoZone',
        address: '123 Main St, San Francisco, CA',
        phone: '(415) 555-0101',
        hours: 'Mon–Sat 7:30–21:00',
      },
      {
        name: "O'Reilly Auto Parts",
        address: '456 Oak Ave, San Francisco, CA',
        phone: '(415) 555-0102',
        hours: 'Mon–Sat 7:00–21:00',
      },
      {
        name: 'NAPA Auto Parts',
        address: '789 Elm Blvd, San Francisco, CA',
        phone: '(415) 555-0103',
        hours: 'Mon–Fri 8:00–18:00',
      },
      {
        name: 'Advance Auto Parts',
        address: '321 Pine Rd, San Francisco, CA',
        phone: '(415) 555-0104',
        hours: 'Daily 8:00–20:00',
      },
    ],
    GB: [
      {
        name: 'Halfords Autocentre',
        address: 'Central London, UK',
        phone: '+44 20 7946 0958',
        hours: 'Mon–Sat 8:00–18:00',
      },
      {
        name: 'Euro Car Parts',
        address: 'Manchester Rd, London, UK',
        phone: '+44 20 7946 0959',
        hours: 'Mon–Fri 8:00–17:30',
      },
      {
        name: 'Kwik Fit',
        address: 'Birmingham, UK',
        phone: '+44 121 496 0000',
        hours: 'Mon–Sat 8:30–17:30',
      },
      {
        name: 'ATS Euromaster',
        address: 'Leeds, UK',
        phone: '+44 113 496 0000',
        hours: 'Mon–Fri 8:00–18:00',
      },
    ],
    DE: [
      {
        name: 'ATU Auto Teile',
        address: 'Berlin Mitte, Germany',
        phone: '+49 30 123456',
        hours: 'Mon–Sat 8:00–20:00',
      },
      {
        name: 'Autodoc Partner Garage',
        address: 'Hamburg, Germany',
        website: 'https://www.autodoc.de',
        hours: 'Mon–Fri 9:00–18:00',
      },
      {
        name: 'Bosch Car Service',
        address: 'Munich, Germany',
        phone: '+49 89 1234567',
        hours: 'Mon–Fri 8:00–17:00',
      },
      {
        name: 'Hella Service Partner',
        address: 'Frankfurt, Germany',
        phone: '+49 69 1234567',
        hours: 'Mon–Sat 9:00–18:00',
      },
    ],
  };

  const list = catalogs[countryCode?.toUpperCase()] || catalogs.US;

  return list.map((shop, i) => {
    const lat = latitude + i * 0.002;
    const lng = longitude + i * 0.002;
    const mapped = {
      id: `mock_${countryCode}_${i}`,
      name: shop.name,
      address: shop.address,
      rating: 4 + (i % 3) * 0.1,
      totalRatings: 80 + i * 25,
      isOpen: i % 2 === 0,
      latitude: lat,
      longitude: lng,
      phone: shop.phone || null,
      website: shop.website || null,
      hoursSummary: shop.hours || null,
      imageUrl: MOCK_SHOP_IMAGES[i % MOCK_SHOP_IMAGES.length],
      source: 'mock',
    };
    mapped.mapsUrl = mapsUrlFor(mapped);
    return mapped;
  });
}

module.exports = { searchNearbyShops };
