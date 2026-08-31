const { Router } = require('express');
const { body } = require('express-validator');
const ctrl = require('../controllers/vehiculos.controller');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');

const r = Router();
r.use(requireAuth);
r.get('/', ctrl.listar);
r.post('/', [
  body('cliente_id').notEmpty(),
  body('marca').trim().notEmpty().escape(),
  body('modelo').trim().notEmpty().escape()
], validate, ctrl.crear);
r.get('/:id/expediente', ctrl.expediente);
module.exports = r;