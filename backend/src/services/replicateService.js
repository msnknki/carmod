const axios = require('axios');

const POLLINATIONS_BASE = 'https://image.pollinations.ai/prompt';

async function generateModifiedCarImage({ prompt }) {
  const enhancedPrompt = `${prompt}, photorealistic car photography, professional automotive photo, dramatic studio lighting, high resolution, detailed`;
  const encoded = encodeURIComponent(enhancedPrompt);
  const seed = Math.floor(Math.random() * 1_000_000);
  const url = `${POLLINATIONS_BASE}/${encoded}?width=1024&height=768&model=flux-realism&nologo=true&seed=${seed}`;

  const response = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 120_000,
  });

  const mimeType = response.headers['content-type'] || 'image/jpeg';
  const base64 = Buffer.from(response.data).toString('base64');

  return {
    imageUrl: `data:${mimeType};base64,${base64}`,
    status: 'succeeded',
  };
}

function buildPrompt({ carMake, carModel, carYear, parts, description }) {
  const carStr = [carYear, carMake, carModel].filter(Boolean).join(' ');
  let prompt = carStr || 'sports car';

  if (parts && parts.length > 0) {
    const partNames = parts.map(p => (typeof p === 'string' ? p : p.title || p.name)).join(', ');
    prompt += ` with ${partNames}`;
  }

  if (description) {
    prompt += `, ${description}`;
  }

  return prompt;
}

module.exports = { generateModifiedCarImage, buildPrompt };
