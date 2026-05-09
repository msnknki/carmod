const express = require('express');
const db = require('../config/database');
const auth = require('../middleware/auth');
const geminiService = require('../services/geminiService');

const router = express.Router();

// POST /api/chat — send a message and get AI response
router.post('/', auth, async (req, res, next) => {
  try {
    const { message, conversationId, carId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get or create conversation
    let convId = conversationId;
    if (!convId) {
      const result = db.prepare(
        'INSERT INTO conversations (user_id, car_id, type, title) VALUES (?, ?, ?, ?)'
      ).run(req.userId, carId || null, 'chat', message.substring(0, 50));
      convId = result.lastInsertRowid;
    }

    // Verify conversation belongs to user
    const conversation = db.prepare(
      'SELECT * FROM conversations WHERE id = ? AND user_id = ?'
    ).get(convId, req.userId);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Save user message
    db.prepare(
      'INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)'
    ).run(convId, 'user', message);

    // Get conversation history
    const history = db.prepare(
      'SELECT role, content FROM messages WHERE conversation_id = ? ORDER BY timestamp ASC'
    ).all(convId);

    // Get car context if available
    let carContext = null;
    const carRefId = carId || conversation.car_id;
    if (carRefId) {
      carContext = db.prepare('SELECT * FROM cars WHERE id = ? AND user_id = ?').get(carRefId, req.userId);
    }

    // Send to Gemini (exclude the message we just saved — it's included in the prompt)
    const previousHistory = history.slice(0, -1);
    const aiResponse = await geminiService.sendMessage(message, carContext, previousHistory);

    // Save AI response
    db.prepare(
      'INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)'
    ).run(convId, 'ai', aiResponse);

    // Update conversation timestamp
    db.prepare('UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(convId);

    res.json({
      conversationId: convId,
      response: aiResponse,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
