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

const SYSTEM_PROMPT = `You are CarMod AI, an expert car modification and repair assistant. You help users with:

1. Car customization advice (exterior and interior modifications)
2. DIY repair guidance with step-by-step instructions
3. Parts recommendations and compatibility checks
4. Cost estimation for modifications and repairs
5. Safety warnings when a repair should be done by a professional

Always be helpful, clear, and safety-conscious. When providing repair instructions, include required tools and difficulty level. If a repair is dangerous or complex, recommend visiting a professional workshop.

When the user has a specific car selected, tailor your advice to that exact make, model, and year.`;

async function sendMessage(message, carContext, conversationHistory = []) {
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
      maxOutputTokens: 1024,
    },
  });

  const fullPrompt = conversationHistory.length === 0
    ? `${SYSTEM_PROMPT}${carInfo}\n\nUser: ${message}`
    : message;

  return withRetry(async () => {
    const result = await chat.sendMessage(fullPrompt);
    return result.response.text();
  });
}

module.exports = { sendMessage };
