const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const errorHandler = require('./src/middleware/errorHandler');

require('./src/config/database');

const {getAuthMode} = require('./src/utils/gemini');
const {getEnvStatus} = require('./src/utils/integrationsStatus');
console.log(`[gemini] Auth mode: ${getAuthMode()}`);
console.log('[env] integrations:', getEnvStatus());

const app = express();

app.use(cors());
app.use(express.json({ limit: '20mb' }));

app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/cars', require('./src/routes/cars'));
app.use('/api/conversations', require('./src/routes/conversations'));
app.use('/api/chat', require('./src/routes/chat'));
app.use('/api/diy', require('./src/routes/diy'));
app.use('/api/parts', require('./src/routes/parts'));
app.use('/api/shops', require('./src/routes/shops'));
app.use('/api/image', require('./src/routes/image'));
app.use('/api/mechanics', require('./src/routes/mechanics'));

app.get('/api/health', async (req, res) => {
  const payload = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: getEnvStatus(),
  };
  if (req.query.probe === 'serper') {
    const {probeSerper} = require('./src/utils/integrationsStatus');
    payload.serperProbe = await probeSerper();
  }
  res.json(payload);
});

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`CarModApp backend running on http://localhost:${PORT}`);
});
