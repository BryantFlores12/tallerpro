const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const env = require('./config/env');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: env.frontendUrl, credentials: true }));
app.use(express.json({ limit: '5mb' }));
app.use(morgan(env.env === 'development' ? 'dev' : 'combined'));

app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { ok: false, message: 'Demasiados intentos. Intente más tarde.' } }));

app.get('/api/health', (req, res) => res.json({ ok: true, service: 'TallerPro API', ts: Date.now() }));
app.use('/api', routes);

// Servir frontend (index.html) y página pública de aprobación (aprobar.html)
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res) => res.status(404).json({ ok: false, message: 'Ruta no encontrada' }));
app.use(errorHandler);

module.exports = app;