const axios = require('axios');

const POLLINATIONS_BASE = 'https://image.pollinations.ai/prompt';

const PRESERVE_REFERENCE =
  'Keep identical car model, body shape, wheels, windows, background, sky, ground, ' +
  'trees, lighting, shadows, and camera angle. Do not add body kits, spoilers, or studio backgrounds.';

const COLOR_EDIT_HINT =
  'This must look like the same photograph with only the requested paint/color change.';

function isColorOnlyEdit(description) {
  const d = (description || '').toLowerCase();
  const colorWords =
    /(paint|color|colour|wrap|repaint|respray|matte|gloss|pearl|metallic)/.test(d);
  const structuralWords =
    /(spoiler|body kit|widebody|wheels|rim|lowered|suspension|add |install|bump|splitter|wing)/.test(
      d,
    );
  return colorWords && !structuralWords;
}

async function generateWithFalEdit({ prompt, carImageDataUrl }) {
  const apiKey = process.env.FAL_API_KEY;
  if (!apiKey) throw new Error('No FAL_API_KEY');

  const res = await axios.post(
    'https://fal.run/fal-ai/flux-2-pro/edit',
    {
      prompt,
      image_urls: [carImageDataUrl],
      image_size: 'auto',
      output_format: 'jpeg',
      enable_safety_checker: true,
    },
    {
      headers: {
        Authorization: `Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 120_000,
    },
  );

  const imageUrl = res.data?.images?.[0]?.url;
  if (!imageUrl) throw new Error('No image in fal.ai response');

  const imgRes = await axios.get(imageUrl, {
    responseType: 'arraybuffer',
    timeout: 30_000,
  });
  const mimeType = imgRes.headers['content-type'] || 'image/jpeg';
  const base64 = Buffer.from(imgRes.data).toString('base64');

  return {
    imageUrl: `data:${mimeType};base64,${base64}`,
    status: 'succeeded',
    provider: 'flux-2-pro/edit',
  };
}

async function generateWithFalText({ prompt }) {
  const apiKey = process.env.FAL_API_KEY;
  if (!apiKey) throw new Error('No FAL_API_KEY');

  const res = await axios.post(
    'https://fal.run/fal-ai/flux-pro',
    {
      prompt,
      num_images: 1,
      output_format: 'jpeg',
      enhance_prompt: false,
      guidance_scale: 3.5,
      num_inference_steps: 28,
    },
    {
      headers: {
        Authorization: `Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 120_000,
    },
  );

  const imageUrl = res.data?.images?.[0]?.url;
  if (!imageUrl) throw new Error('No image in fal.ai response');

  const imgRes = await axios.get(imageUrl, {
    responseType: 'arraybuffer',
    timeout: 30_000,
  });
  const mimeType = imgRes.headers['content-type'] || 'image/jpeg';
  const base64 = Buffer.from(imgRes.data).toString('base64');

  return {
    imageUrl: `data:${mimeType};base64,${base64}`,
    status: 'succeeded',
    provider: 'flux-pro',
  };
}

async function generateWithPollinations({ prompt }) {
  const enhancedPrompt = `${prompt}, photorealistic car photography, high resolution, detailed`;
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
    provider: 'pollinations',
  };
}

async function generateModifiedCarImage({ prompt, imageUrl }) {
  if (imageUrl) {
    return generateWithFalEdit({ prompt, carImageDataUrl: imageUrl });
  }

  try {
    return await generateWithFalText({ prompt });
  } catch (err) {
    console.error('fal.ai failed, falling back to Pollinations:', err.message);
    return generateWithPollinations({ prompt });
  }
}

function buildPrompt({
  carMake,
  carModel,
  carYear,
  parts,
  description,
  hasReferenceImage = false,
  isRefinement = false,
}) {
  const carStr = [carYear, carMake, carModel].filter(Boolean).join(' ');
  const desc = (description || '').trim();
  const partList =
    parts && parts.length > 0
      ? parts.map(p => (typeof p === 'string' ? p : p.title || p.name)).join(', ')
      : '';

  if (hasReferenceImage) {
    if (desc && isColorOnlyEdit(desc)) {
      return (
        `Change ONLY the car body paint color in this photo: ${desc}. ` +
        `${PRESERVE_REFERENCE} ${COLOR_EDIT_HINT}`
      );
    }

    if (isRefinement && desc) {
      return `Edit this exact car photo: ${desc}. ${PRESERVE_REFERENCE}`;
    }

    if (partList) {
      let prompt = `Edit this exact car photo: add ${partList} to the car only.`;
      if (desc) prompt += ` ${desc}.`;
      prompt += ` ${PRESERVE_REFERENCE}`;
      return prompt;
    }

    if (desc) {
      return `Edit this exact car photo: ${desc}. ${PRESERVE_REFERENCE}`;
    }

    return `Edit this exact car photo of ${carStr || 'the car'}. ${PRESERVE_REFERENCE}`;
  }

  if (partList) {
    const base = carStr ? `this ${carStr}` : 'this car';
    let prompt = `Add ${partList} to ${base}`;
    if (desc) prompt += `. ${desc}`;
    prompt += '. Photorealistic automotive photography.';
    return prompt;
  }

  let prompt = carStr || 'sports car';
  if (desc) prompt += `, ${desc}`;
  prompt += ', photorealistic automotive photography';
  return prompt;
}

module.exports = {
  generateModifiedCarImage,
  buildPrompt,
  PRESERVE_REFERENCE,
  isColorOnlyEdit,
};
