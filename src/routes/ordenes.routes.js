const { Router } = require('express');
const { body } = require('express-validator');
const ctrl = require('../controllers/ordenes.controller');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');

const r = Router();
r.use(requireAuth);
r.get('/', ctrl.listar);
r.get('/:id', ctrl.detalle);
r.post('/', [
  body('cliente_id').notEmpty(),
  body('vehiculo_id').notEmpty(),
  body('motivo').trim().notEmpty().withMessage('Motivo requerido').escape(),
  body('gasolina').optional().isInt({ min: 0, max: 100 })
], validate, ctrl.crear);
module.exports = r;