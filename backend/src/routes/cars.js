const express = require('express');
const db = require('../config/database');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, (req, res) => {
  const cars = db.prepare('SELECT * FROM cars WHERE user_id = ? ORDER BY created_at DESC').all(req.userId);
  res.json(cars);
});

router.post('/', auth, (req, res) => {
  const { make, model, year, imageUri } = req.body;

  if (!make || !model || !year) {
    return res.status(400).json({ error: 'Make, model, and year are required' });
  }

  const result = db.prepare(
    'INSERT INTO cars (user_id, make, model, year, image_uri) VALUES (?, ?, ?, ?, ?)'
  ).run(req.userId, make, model, year, imageUri || null);

  res.status(201).json({
    id: result.lastInsertRowid,
    user_id: req.userId,
    make,
    model,
    year,
    image_uri: imageUri || null,
  });
});

router.patch('/:id', auth, (req, res) => {
  const { imageUri } = req.body;
  const car = db.prepare('SELECT * FROM cars WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!car) return res.status(404).json({ error: 'Car not found' });
  db.prepare('UPDATE cars SET image_uri = ? WHERE id = ?').run(imageUri ?? null, req.params.id);
  res.json({ id: req.params.id, image_uri: imageUri ?? null });
});

router.delete('/', auth, (req, res) => {
  const userId = req.userId;
  db.prepare('DELETE FROM modification_projects WHERE user_id = ?').run(userId);
  db.prepare('DELETE FROM conversations WHERE user_id = ?').run(userId);
  db.prepare('DELETE FROM cars WHERE user_id = ?').run(userId);
  res.json({ message: 'Garage reset' });
});

router.delete('/:id', auth, (req, res) => {
  const car = db.prepare('SELECT * FROM cars WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!car) {
    return res.status(404).json({ error: 'Car not found' });
  }

  db.prepare('DELETE FROM cars WHERE id = ?').run(req.params.id);
  res.json({ message: 'Car deleted' });
});

module.exports = router;
