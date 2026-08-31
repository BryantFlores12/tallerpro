const pool = require('../config/db');
const { ok, ApiError } = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

exports.listar = asyncHandler(async (req, res) => {
  const where = req.user.rol === 'mecanico' ? 'WHERE t.tecnico_id = ?' : '';
  const params = req.user.rol === 'mecanico' ? [req.user.sub] : [];
  const [rows] = await pool.query(
    `SELECT t.*, v.marca, v.modelo, v.anio, v.placa, o.folio, u.nombre AS tecnico
     FROM tareas t JOIN vehiculos v ON v.id=t.vehiculo_id LEFT JOIN ordenes o ON o.id=t.orden_id
     LEFT JOIN usuarios u ON u.id=t.tecnico_id ${where} ORDER BY t.eta`, params);
  ok(res, rows);
});

exports.actualizar = asyncHandler(async (req, res) => {
  const { estado, refaccion_estado, avance } = req.body;
  const [r] = await pool.query(
    'UPDATE tareas SET estado=COALESCE(?,estado), refaccion_estado=COALESCE(?,refaccion_estado), avance=COALESCE(?,avance) WHERE id=?',
    [estado, refaccion_estado, avance, req.params.id]);
  if (!r.affectedRows) throw new ApiError(404, 'Tarea no encontrada');
  ok(res, { actualizado: true });
});