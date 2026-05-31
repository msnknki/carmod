const express = require('express');
const db = require('../config/database');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, (req, res) => {
  const conversations = db.prepare(
    'SELECT * FROM conversations WHERE user_id = ? ORDER BY updated_at DESC'
  ).all(req.userId);
  res.json(conversations);
});

router.post('/', auth, (req, res) => {
  const { carId, type, title } = req.body;

  if (!type || !title) {
    return res.status(400).json({ error: 'Type and title are required' });
  }

  const result = db.prepare(
    'INSERT INTO conversations (user_id, car_id, type, title) VALUES (?, ?, ?, ?)'
  ).run(req.userId, carId || null, type, title);

  res.status(201).json({
    id: result.lastInsertRowid,
    user_id: req.userId,
    car_id: carId || null,
    type,
    title,
  });
});

router.get('/:id/messages', auth, (req, res) => {
  const conversation = db.prepare(
    'SELECT * FROM conversations WHERE id = ? AND user_id = ?'
  ).get(req.params.id, req.userId);

  if (!conversation) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  const messages = db.prepare(
    'SELECT * FROM messages WHERE conversation_id = ? ORDER BY timestamp ASC'
  ).all(req.params.id);

  res.json(messages);
});

router.post('/:id/messages', auth, (req, res) => {
  const { role, content } = req.body;

  if (!role || !content) {
    return res.status(400).json({ error: 'Role and content are required' });
  }

  const conversation = db.prepare(
    'SELECT * FROM conversations WHERE id = ? AND user_id = ?'
  ).get(req.params.id, req.userId);

  if (!conversation) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  const result = db.prepare(
    'INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)'
  ).run(req.params.id, role, content);

  db.prepare('UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(req.params.id);

  res.status(201).json({
    id: result.lastInsertRowid,
    conversation_id: parseInt(req.params.id),
    role,
    content,
  });
});

module.exports = router;
