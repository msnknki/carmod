const axios = require('axios');
const { readEnv, isSet } = require('./env');
const { getAuthMode } = require('./gemini');

async function probeSerper() {
  const apiKey = readEnv('SERPER_API_KEY');
  if (!apiKey) {
    return { ok: false, error: 'SERPER_API_KEY is not set' };
  }

  try {
    const res = await axios.post(
      'https://google.serper.dev/shopping',
      { q: 'brake pads', gl: 'us', num: 1 },
      {
        headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' },
        timeout: 12000,
      },
    );
    const count = res.data?.shopping?.length ?? 0;
    return { ok: true, resultCount: count };
  } catch (err) {
    const status = err.response?.status;
    const message = err.response?.data?.message || err.message;
    return {
      ok: false,
      httpStatus: status,
      error: message,
      hint:
        status === 401 || status === 403
          ? 'Key is invalid or expired — create a new key at serper.dev'
          : 'Serper request failed',
    };
  }
}

function getEnvStatus() {
  return {
    GEMINI_API_KEY: isSet('GEMINI_API_KEY'),
    SERPER_API_KEY: isSet('SERPER_API_KEY'),
    GOOGLE_PLACES_API_KEY: isSet('GOOGLE_PLACES_API_KEY'),
    JWT_SECRET: isSet('JWT_SECRET'),
    EBAY_API_KEY: isSet('EBAY_API_KEY'),
    ALIEXPRESS_API_KEY: isSet('ALIEXPRESS_API_KEY'),
    geminiAuthMode: getAuthMode(),
  };
}

module.exports = { getEnvStatus, probeSerper };
