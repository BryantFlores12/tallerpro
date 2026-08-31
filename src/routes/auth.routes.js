const { Router } = require('express');
const { body } = require('express-validator');
const ctrl = require('../controllers/auth.controller');
const validate = require('../middleware/validate');
const { requireAuth, requireRole } = require('../middleware/auth');

const r = Router();
r.post('/login', [
  body('email').isEmail().withMessage('Correo inválido').normalizeEmail(),
  body('password').notEmpty().withMessage('Contraseña requerida')
], validate, ctrl.login);

r.post('/usuarios', requireAuth, requireRole('admin'), [
  body('nombre').trim().notEmpty().escape(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('rol').isIn(['admin', 'recepcion', 'mecanico'])
], validate, ctrl.crearUsuario);
module.exports = r;