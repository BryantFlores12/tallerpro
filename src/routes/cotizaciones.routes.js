const { Router } = require('express');
const { body } = require('express-validator');
const ctrl = require('../controllers/cotizaciones.controller');
const validate = require('../middleware/validate');
const { requireAuth, requireRole } = require('../middleware/auth');

const r = Router();
r.use(requireAuth, requireRole('admin', 'recepcion'));
r.get('/', ctrl.listar);
r.post('/', [
  body('cliente_id').notEmpty(),
  body('vehiculo_id').notEmpty(),
  body('items').isArray({ min: 1 }).withMessage('Agregue al menos una partida')
], validate, ctrl.crear);
r.get('/:id', ctrl.detalle);
r.patch('/:id', ctrl.cambiarEstado);
r.post('/:id/aprobar', ctrl.aprobar);
r.post('/:id/pagos', body('monto').isFloat({ min: 0.01 }), validate, ctrl.registrarPago);
module.exports = r;