const { Router } = require('express');
const { body } = require('express-validator');
const ctrl = require('../controllers/public.controller');
const validate = require('../middleware/validate');

const r = Router();
r.get('/cotizacion/:token', ctrl.verCotizacion);
r.post('/cotizacion/:token/decision', [body('decision').isIn(['aprobar', 'rechazar'])], validate, ctrl.decidir);
module.exports = r;