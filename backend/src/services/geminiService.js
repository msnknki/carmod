const { generateChat } = require('../utils/gemini');

const SYSTEM_PROMPT = `You are CarMod AI, a car modification and repair assistant. Keep every reply under 80 words — be direct and concise. No bullet-point walls, no long intros.

Rules:
- Parts questions: name the part + brief compatibility note. Do NOT list prices (a parts panel is shown separately).
- Repair questions: give the key steps only, flag if professional help is needed.
- Tailor advice to the user's exact car when provided.
- If the question is vague, ask one clarifying question.`;

async function sendMessage(message, carContext, conversationHistory = [], imageDataUrl = null) {
  const carInfo = carContext
    ? `\n\nUser's current car: ${carContext.year} ${carContext.make} ${carContext.model}`
    : '';

  const isFirstTurn = conversationHistory.length === 0;
  return generateChat({
    systemText: isFirstTurn ? `${SYSTEM_PROMPT}${carInfo}` : undefined,
    message,
    history: isFirstTurn ? [] : conversationHistory,
    imageDataUrl,
    generationConfig: {maxOutputTokens: 400},
  });
}

module.exports = { sendMessage };
