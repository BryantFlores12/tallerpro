const { Router } = require('express');
const { body } = require('express-validator');
const ctrl = require('../controllers/inventario.controller');
const validate = require('../middleware/validate');
const { requireAuth, requireRole } = require('../middleware/auth');

const r = Router();
r.use(requireAuth);
r.get('/', ctrl.listar);
r.get('/bajo-stock', ctrl.bajoStock);
r.get('/trazabilidad', requireRole('admin', 'recepcion'), ctrl.trazabilidad);
r.post('/movimiento', [
  body('parte_id').notEmpty(),
  body('tipo').isIn(['entrada', 'salida']),
  body('cantidad').isInt({ min: 1 })
], validate, ctrl.movimiento);
module.exports = r;