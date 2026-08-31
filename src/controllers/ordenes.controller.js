const crypto = require('crypto');
const pool = require('../config/db');
const { ok, ApiError } = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const nextFolio = require('../utils/folios');
const id = () => crypto.randomBytes(12).toString('hex');

exports.listar = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT o.*, a.nombre AS asesor, t.nombre AS tecnico
     FROM ordenes o LEFT JOIN usuarios a ON a.id=o.asesor_id LEFT JOIN usuarios t ON t.id=o.tecnico_id
     ORDER BY o.creado_en DESC LIMIT 200`);
  ok(res, rows);
});

exports.detalle = asyncHandler(async (req, res) => {
  const [[o]] = await pool.query('SELECT * FROM ordenes WHERE id=?', [req.params.id]);
  if (!o) throw new ApiError(404, 'Orden no encontrada');
  ok(res, o);
});

exports.crear = asyncHandler(async (req, res) => {
  const { cliente_id, vehiculo_id, tecnico_id, motivo, km, gasolina, zonas, valores, obs, firma_data, modo } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const folio = await nextFolio(conn, 'orden', 'ORD');
    const link = `https://app.tallerpro.mx/i/${folio.toLowerCase()}-${crypto.randomBytes(2).toString('hex')}`;
    const oid = id();
    await conn.query(
      `INSERT INTO ordenes (id,folio,cliente_id,vehiculo_id,asesor_id,tecnico_id,estado,motivo,km,gasolina,zonas,valores,obs,firma_data,modo,link)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [oid, folio, cliente_id, vehiculo_id, req.user.sub, tecnico_id || null, 'Activa', motivo, km, gasolina,
       JSON.stringify(zonas || []), JSON.stringify(valores || []), obs, firma_data || null, modo || 'firma', link]);
    await conn.query('INSERT INTO tareas (id,orden_id,vehiculo_id,tecnico_id,estado,prioridad,eta,avance) VALUES (?,?,?,?,?,?,CURDATE(),5)',
      [id(), oid, vehiculo_id, tecnico_id || null, 'diag', 'Media']);
    await conn.query('INSERT INTO auditoria (id,usuario_id,modulo,accion,registro_id) VALUES (UUID(),?,?,?,?)',
      [req.user.sub, 'ordenes', 'crear', oid]);
    await conn.commit();
    ok(res, { id: oid, folio, link }, 201);
  } catch (e) { await conn.rollback(); throw e; }
  finally { conn.release(); }
});