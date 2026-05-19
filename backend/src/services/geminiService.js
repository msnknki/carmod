const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const MODEL = 'gemini-2.5-flash-lite';

async function withRetry(fn, retries = 3) {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (err) {
      const msg = err?.message || '';
      const retryable = msg.includes('429') || msg.includes('503') || err?.status === 429 || err?.status === 503;
      if (retryable && i < retries) {
        await new Promise(r => setTimeout(r, (i + 1) * 2000));
        continue;
      }
      if (retryable) throw new Error('AI service is busy — please wait a moment and try again.');
      throw err;
    }
  }
}

const SYSTEM_PROMPT = `You are CarMod AI, a car modification and repair assistant. Keep every reply under 80 words — be direct and concise. No bullet-point walls, no long intros.

Rules:
- Parts questions: name the part + brief compatibility note. Do NOT list prices (a parts panel is shown separately).
- Repair questions: give the key steps only, flag if professional help is needed.
- Tailor advice to the user's exact car when provided.
- If the question is vague, ask one clarifying question.`;

async function sendMessage(message, carContext, conversationHistory = [], imageDataUrl = null) {
  const model = genAI.getGenerativeModel({ model: MODEL });

  const carInfo = carContext
    ? `\n\nUser's current car: ${carContext.year} ${carContext.make} ${carContext.model}`
    : '';

  const chat = model.startChat({
    history: conversationHistory.map(msg => ({
      role: msg.role === 'ai' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    })),
    generationConfig: {
      maxOutputTokens: 400,
    },
  });

  const fullPrompt = conversationHistory.length === 0
    ? `${SYSTEM_PROMPT}${carInfo}\n\nUser: ${message}`
    : message;

  return withRetry(async () => {
    let msgParts;
    if (imageDataUrl) {
      const match = imageDataUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        msgParts = [
          { inlineData: { mimeType: match[1], data: match[2] } },
          { text: fullPrompt },
        ];
      }
    }
    const result = await chat.sendMessage(msgParts ?? fullPrompt);
    return result.response.text();
  });
}

module.exports = { sendMessage };
