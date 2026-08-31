const crypto = require('crypto');
const pool = require('../config/db');
const { ok, ApiError } = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const id = () => crypto.randomBytes(12).toString('hex');

exports.listar = asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM vehiculos ORDER BY marca, modelo');
  ok(res, rows);
});

exports.crear = asyncHandler(async (req, res) => {
  const { cliente_id, marca, modelo, anio, vin, placa, kilometraje, color } = req.body;
  const [[cli]] = await pool.query('SELECT id FROM clientes WHERE id=?', [cliente_id]);
  if (!cli) throw new ApiError(404, 'Cliente no encontrado');
  const nuevo = id();
  await pool.query('INSERT INTO vehiculos (id,cliente_id,marca,modelo,anio,vin,placa,kilometraje,color) VALUES (?,?,?,?,?,?,?,?,?)',
    [nuevo, cliente_id, marca, modelo, anio, vin, placa, kilometraje || 0, color]);
  ok(res, { id: nuevo }, 201);
});

exports.expediente = asyncHandler(async (req, res) => {
  const [[v]] = await pool.query('SELECT v.*, c.nombre AS cliente FROM vehiculos v JOIN clientes c ON c.id=v.cliente_id WHERE v.id=?', [req.params.id]);
  if (!v) throw new ApiError(404, 'Vehículo no encontrado');
  const [historial] = await pool.query(
    'SELECT b.*, u.nombre AS tecnico_nombre FROM bitacora b LEFT JOIN usuarios u ON u.id=b.tecnico_id WHERE b.vehiculo_id=? ORDER BY b.creado_en DESC', [v.id]);
  ok(res, { ...v, historial });
});