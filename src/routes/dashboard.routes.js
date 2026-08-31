const { Router } = require('express');
const ctrl = require('../controllers/dashboard.controller');
const { requireAuth } = require('../middleware/auth');

const r = Router();
r.get('/', requireAuth, ctrl.resumen);
module.exports = r;