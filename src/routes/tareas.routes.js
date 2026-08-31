const { Router } = require('express');
const ctrl = require('../controllers/tareas.controller');
const { requireAuth } = require('../middleware/auth');

const r = Router();
r.use(requireAuth);
r.get('/', ctrl.listar);
r.patch('/:id', ctrl.actualizar);
module.exports = r;