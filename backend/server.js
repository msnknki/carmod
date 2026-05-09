const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const errorHandler = require('./src/middleware/errorHandler');

// Initialize database (runs schema on first load)
require('./src/config/database');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/cars', require('./src/routes/cars'));
app.use('/api/conversations', require('./src/routes/conversations'));
app.use('/api/chat', require('./src/routes/chat'));
app.use('/api/diy', require('./src/routes/diy'));
app.use('/api/parts', require('./src/routes/parts'));
app.use('/api/shops', require('./src/routes/shops'));
app.use('/api/image', require('./src/routes/image'));
app.use('/api/estimate', require('./src/routes/estimate'));
app.use('/api/mechanics', require('./src/routes/mechanics'));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`CarModApp backend running on http://localhost:${PORT}`);
});
