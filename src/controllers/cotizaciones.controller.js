const crypto = require('crypto');
const pool = require('../config/db');
const { ok, ApiError } = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const nextFolio = require('../utils/folios');
const id = () => crypto.randomBytes(12).toString('hex');

exports.listar = asyncHandler(async (req, res) => {
  const [cots] = await pool.query('SELECT * FROM cotizaciones ORDER BY creado_en DESC');
  const [items] = await pool.query('SELECT * FROM cotizacion_items');
  const [pagos] = await pool.query('SELECT * FROM pagos ORDER BY fecha');
  const mi = {}, mp = {};
  items.forEach(i => (mi[i.cotizacion_id] = mi[i.cotizacion_id] || []).push(i));
  pagos.forEach(p => (mp[p.cotizacion_id] = mp[p.cotizacion_id] || []).push(p));
  cots.forEach(c => { c.items = mi[c.id] || []; c.pagos = mp[c.id] || []; });
  ok(res, cots);
});

exports.detalle = asyncHandler(async (req, res) => {
  const [[c]] = await pool.query('SELECT * FROM cotizaciones WHERE id=?', [req.params.id]);
  if (!c) throw new ApiError(404, 'Cotización no encontrada');
  const [items] = await pool.query('SELECT * FROM cotizacion_items WHERE cotizacion_id=?', [c.id]);
  const [pagos] = await pool.query('SELECT * FROM pagos WHERE cotizacion_id=? ORDER BY fecha', [c.id]);
  ok(res, { ...c, items, pagos });
});

exports.crear = asyncHandler(async (req, res) => {
  const { cliente_id, vehiculo_id, estado, notas, items } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const folio = await nextFolio(conn, 'cotizacion', 'COT');
    const cid = id();
    const token = crypto.randomBytes(24).toString('hex');
    await conn.query('INSERT INTO cotizaciones (id,folio,cliente_id,vehiculo_id,estado,notas,approval_token) VALUES (?,?,?,?,?,?,?)',
      [cid, folio, cliente_id, vehiculo_id, estado || 'Borrador', notas, token]);
    for (const it of items || []) {
      await conn.query('INSERT INTO cotizacion_items (id,cotizacion_id,tipo,descripcion,cantidad,horas,costo,margen,tarifa) VALUES (?,?,?,?,?,?,?,?,?)',
        [id(), cid, it.tipo, it.desc, it.cant || 1, it.horas || 0, it.costo || 0, it.margen || 0, it.tarifa || 0]);
    }
    await conn.commit();
    ok(res, { id: cid, folio, token }, 201);
  } catch (e) { await conn.rollback(); throw e; }
  finally { conn.release(); }
});

exports.aprobar = asyncHandler(async (req, res) => {
  const { aprobada } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[c]] = await conn.query('SELECT * FROM cotizaciones WHERE id=? FOR UPDATE', [req.params.id]);
    if (!c) throw new ApiError(404, 'Cotización no encontrada');
    await conn.query('UPDATE cotizaciones SET estado=? WHERE id=?', [aprobada ? 'Aprobada' : 'Rechazada', c.id]);
    if (aprobada) await conn.query('INSERT INTO tareas (id,vehiculo_id,estado,prioridad,eta,avance) VALUES (?,?,?,?,CURDATE(),10)',
      [id(), c.vehiculo_id, 'diag', 'Alta']);
    await conn.commit();
    ok(res, { estado: aprobada ? 'Aprobada' : 'Rechazada' });
  } catch (e) { await conn.rollback(); throw e; }
  finally { conn.release(); }
});

exports.cambiarEstado = asyncHandler(async (req, res) => {
  const { estado } = req.body;
  const [r] = await pool.query('UPDATE cotizaciones SET estado=? WHERE id=?', [estado, req.params.id]);
  if (!r.affectedRows) throw new ApiError(404, 'Cotización no encontrada');
  ok(res, { estado });
});

exports.registrarPago = asyncHandler(async (req, res) => {
  const { monto, metodo } = req.body;
  await pool.query('INSERT INTO pagos (id,cotizacion_id,monto,metodo,fecha,usuario_id) VALUES (?,?,?,?,CURDATE(),?)',
    [id(), req.params.id, monto, metodo, req.user.sub]);
  ok(res, { registrado: true }, 201);
});