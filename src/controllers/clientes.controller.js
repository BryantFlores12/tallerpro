const crypto = require('crypto');
const pool = require('../config/db');
const { ok, ApiError } = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const id = () => crypto.randomBytes(12).toString('hex');

exports.listar = asyncHandler(async (req, res) => {
  const q = (req.query.q || '').trim();
  const [rows] = await pool.query(
    `SELECT c.*, (SELECT COUNT(*) FROM vehiculos v WHERE v.cliente_id = c.id) AS vehiculos,
       (SELECT MAX(creado_en) FROM ordenes o WHERE o.cliente_id = c.id) AS ultima_visita
     FROM clientes c WHERE c.nombre LIKE ? OR c.telefono LIKE ? OR c.email LIKE ? ORDER BY c.nombre`,
    [`%${q}%`, `%${q}%`, `%${q}%`]);
  ok(res, rows);
});

exports.detalle = asyncHandler(async (req, res) => {
  const [[c]] = await pool.query('SELECT * FROM clientes WHERE id = ?', [req.params.id]);
  if (!c) throw new ApiError(404, 'Cliente no encontrado');
  const [vehiculos] = await pool.query('SELECT * FROM vehiculos WHERE cliente_id = ?', [c.id]);
  const [ordenes] = await pool.query('SELECT id,folio,fecha,estado,motivo,gasolina,modo FROM ordenes WHERE cliente_id = ? ORDER BY creado_en DESC', [c.id]);
  ok(res, { ...c, vehiculos, ordenes });
});

exports.crear = asyncHandler(async (req, res) => {
  const { nombre, telefono, email, rfc, direccion, notas } = req.body;
  const nuevo = id();
  await pool.query('INSERT INTO clientes (id,nombre,telefono,email,rfc,direccion,notas,creado_por) VALUES (?,?,?,?,?,?,?,?)',
    [nuevo, nombre, telefono, email, rfc, direccion, notas, req.user.sub]);
  ok(res, { id: nuevo }, 201);
});

exports.actualizar = asyncHandler(async (req, res) => {
  const { nombre, telefono, email, rfc, direccion, notas } = req.body;
  const [r] = await pool.query('UPDATE clientes SET nombre=?,telefono=?,email=?,rfc=?,direccion=?,notas=? WHERE id=?',
    [nombre, telefono, email, rfc, direccion, notas, req.params.id]);
  if (!r.affectedRows) throw new ApiError(404, 'Cliente no encontrado');
  ok(res, { actualizado: true });
});

exports.eliminar = asyncHandler(async (req, res) => {
  try {
    const [r] = await pool.query('DELETE FROM clientes WHERE id = ?', [req.params.id]);
    if (!r.affectedRows) throw new ApiError(404, 'Cliente no encontrado');
    ok(res, { eliminado: true });
  } catch (e) {
    if (e.code === 'ER_ROW_IS_REFERENCED_2') throw new ApiError(409, 'No se puede eliminar: el cliente tiene órdenes asociadas.');
    throw e;
  }
});