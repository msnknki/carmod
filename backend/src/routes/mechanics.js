const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const router = express.Router();

router.post('/register', (req, res) => {
  const { name, email, password, phone, location, specialization, carBrands } = req.body;

  if (!name || !email || !password || !phone || !location || !specialization) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (!['electrical', 'mechanical', 'both'].includes(specialization)) {
    return res.status(400).json({ error: 'Invalid specialization value' });
  }

  const existing = db.prepare('SELECT id FROM mechanics WHERE email = ?').get(email);
  if (existing) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const carBrandsJson = JSON.stringify(Array.isArray(carBrands) ? carBrands : []);

  const result = db.prepare(
    'INSERT INTO mechanics (name, email, password_hash, phone, location, specialization, car_brands) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(name, email.toLowerCase().trim(), passwordHash, phone, location, specialization, carBrandsJson);

  const token = jwt.sign(
    { mechanicId: result.lastInsertRowid },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.status(201).json({
    token,
    mechanic: {
      id: result.lastInsertRowid,
      name,
      email: email.toLowerCase().trim(),
      phone,
      location,
      specialization,
      carBrands: Array.isArray(carBrands) ? carBrands : [],
    },
  });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const mechanic = db.prepare('SELECT * FROM mechanics WHERE email = ?').get(email.toLowerCase().trim());
  if (!mechanic || !bcrypt.compareSync(password, mechanic.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = jwt.sign(
    { mechanicId: mechanic.id },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    token,
    mechanic: {
      id: mechanic.id,
      name: mechanic.name,
      email: mechanic.email,
      phone: mechanic.phone,
      location: mechanic.location,
      specialization: mechanic.specialization,
      carBrands: JSON.parse(mechanic.car_brands || '[]'),
    },
  });
});

router.get('/', (_req, res) => {
  const rows = db.prepare(
    'SELECT id, name, phone, location, specialization, car_brands, created_at FROM mechanics ORDER BY created_at DESC'
  ).all();

  res.json(
    rows.map(m => ({
      id: m.id,
      name: m.name,
      phone: m.phone,
      location: m.location,
      specialization: m.specialization,
      carBrands: JSON.parse(m.car_brands || '[]'),
      createdAt: m.created_at,
    }))
  );
});

module.exports = router;
