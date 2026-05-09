const express = require('express');
const db = require('../config/database');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/cars — get all cars for the logged-in user
router.get('/', auth, (req, res) => {
  const cars = db.prepare('SELECT * FROM cars WHERE user_id = ? ORDER BY created_at DESC').all(req.userId);
  res.json(cars);
});

// POST /api/cars — add a new car
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

// DELETE /api/cars/:id — delete a car
router.delete('/:id', auth, (req, res) => {
  const car = db.prepare('SELECT * FROM cars WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!car) {
    return res.status(404).json({ error: 'Car not found' });
  }

  db.prepare('DELETE FROM cars WHERE id = ?').run(req.params.id);
  res.json({ message: 'Car deleted' });
});

module.exports = router;
