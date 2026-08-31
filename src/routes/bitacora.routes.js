const { Router } = require('express');
const { body } = require('express-validator');
const ctrl = require('../controllers/bitacora.controller');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');

const r = Router();
r.use(requireAuth);
r.get('/', ctrl.listar);
r.get('/vehiculo/:vehiculoId', ctrl.porVehiculo);
r.post('/', [
  body('vehiculo_id').notEmpty(),
  body('sintoma').trim().notEmpty().withMessage('Síntoma requerido').escape()
], validate, ctrl.crearRegistro);
module.exports = r;