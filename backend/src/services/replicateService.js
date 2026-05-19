const axios = require('axios');

const POLLINATIONS_BASE = 'https://image.pollinations.ai/prompt';

async function generateWithFal({ prompt, carImageDataUrl }) {
  const apiKey = process.env.FAL_API_KEY;
  if (!apiKey) throw new Error('No FAL_API_KEY');

  const body = {
    prompt,
    num_images: 1,
    output_format: 'jpeg',
    guidance_scale: 3.5,
    num_inference_steps: 28,
  };

  if (carImageDataUrl) {
    body.image_url = carImageDataUrl;
  }

  const endpoint = carImageDataUrl
    ? 'https://fal.run/fal-ai/flux-pro/kontext'
    : 'https://fal.run/fal-ai/flux-pro';

  const res = await axios.post(endpoint, body, {
    headers: {
      Authorization: `Key ${apiKey}`,
      'Content-Type': 'application/json',
    },
    timeout: 120_000,
  });

  const imageUrl = res.data?.images?.[0]?.url;
  if (!imageUrl) throw new Error('No image in fal.ai response');

  // Fetch and return as base64 so the app doesn't need to reach fal CDN
  const imgRes = await axios.get(imageUrl, {
    responseType: 'arraybuffer',
    timeout: 30_000,
  });
  const mimeType = imgRes.headers['content-type'] || 'image/jpeg';
  const base64 = Buffer.from(imgRes.data).toString('base64');

  return {
    imageUrl: `data:${mimeType};base64,${base64}`,
    status: 'succeeded',
  };
}

async function generateWithPollinations({ prompt }) {
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

async function generateModifiedCarImage({ prompt, imageUrl }) {
  try {
    return await generateWithFal({ prompt, carImageDataUrl: imageUrl });
  } catch (err) {
    console.error('fal.ai failed, falling back to Pollinations:', err.message);
    return generateWithPollinations({ prompt });
  }
}

function buildPrompt({ carMake, carModel, carYear, parts, description }) {
  const carStr = [carYear, carMake, carModel].filter(Boolean).join(' ');

  if (parts && parts.length > 0) {
    const partNames = parts.map(p => (typeof p === 'string' ? p : p.title || p.name)).join(', ');
    // When we have a reference image, instruct to modify it directly
    const base = carStr ? `this ${carStr}` : 'this car';
    let prompt = `Add ${partNames} to ${base}`;
    if (description) prompt += `. ${description}`;
    prompt += '. Keep the same car body, color, and angle. Photorealistic automotive photography.';
    return prompt;
  }

  let prompt = carStr || 'sports car';
  if (description) prompt += `, ${description}`;
  prompt += ', photorealistic automotive photography';
  return prompt;
}

module.exports = { generateModifiedCarImage, buildPrompt };
