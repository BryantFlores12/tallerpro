const crypto = require('crypto');
const pool = require('../config/db');
const { ok, ApiError } = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const id = () => crypto.randomBytes(12).toString('hex');

exports.listar = asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM bitacora ORDER BY creado_en DESC');
  const [fotos] = await pool.query('SELECT bitacora_id, url FROM bitacora_fotos');
  const map = {}; fotos.forEach(f => (map[f.bitacora_id] = map[f.bitacora_id] || []).push(f.url));
  rows.forEach(r => r.fotos = map[r.id] || []);
  ok(res, rows);
});

exports.porVehiculo = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    'SELECT b.*, u.nombre AS tecnico_nombre FROM bitacora b LEFT JOIN usuarios u ON u.id=b.tecnico_id WHERE b.vehiculo_id=? ORDER BY b.creado_en DESC',
    [req.params.vehiculoId]);
  ok(res, rows);
});

exports.crearRegistro = asyncHandler(async (req, res) => {
  const { vehiculo_id, orden_id, tecnico_id, tipo, estado, sintoma, mediciones, fusibles, descartadas, notas, fotos } = req.body;
  const bid = id();
  await pool.query(
    `INSERT INTO bitacora (id,vehiculo_id,orden_id,tecnico_id,tipo,estado,sintoma,mediciones,fusibles,descartadas,notas)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    [bid, vehiculo_id, orden_id || null, tecnico_id || req.user.sub, tipo, estado || 'En proceso', sintoma,
     JSON.stringify(mediciones || []), JSON.stringify(fusibles || []), JSON.stringify(descartadas || []), notas]);
  if (Array.isArray(fotos) && fotos.length) {
    for (const url of fotos) await pool.query('INSERT INTO bitacora_fotos (id,bitacora_id,url) VALUES (?,?,?)', [id(), bid, url]);
  }
  ok(res, { id: bid }, 201);
});