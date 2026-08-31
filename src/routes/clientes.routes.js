const { Router } = require('express');
const { body } = require('express-validator');
const ctrl = require('../controllers/clientes.controller');
const validate = require('../middleware/validate');
const { requireAuth, requireRole } = require('../middleware/auth');

const r = Router();
r.use(requireAuth);
r.get('/', ctrl.listar);
r.get('/:id', ctrl.detalle);
r.post('/', requireRole('admin', 'recepcion'), [
  body('nombre').trim().notEmpty().withMessage('Nombre requerido').escape(),
  body('telefono').optional().trim().escape(),
  body('email').optional().isEmail().normalizeEmail()
], validate, ctrl.crear);
r.put('/:id', requireRole('admin', 'recepcion'), ctrl.actualizar);
r.delete('/:id', requireRole('admin'), ctrl.eliminar);
module.exports = r;