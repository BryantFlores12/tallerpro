const crypto = require('crypto');
const pool = require('../config/db');
const { ok, ApiError } = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

function calcTotals(items, ivaPct) {
  let pz = 0, mn = 0;
  items.forEach(it => {
    const costo = parseFloat(it.costo) || 0, margen = parseFloat(it.margen) || 0;
    const cant = parseFloat(it.cantidad) || 0, horas = parseFloat(it.horas) || 0, tarifa = parseFloat(it.tarifa) || 0;
    if (it.tipo === 'pieza') pz += costo * (1 + margen / 100) * cant; else mn += horas * tarifa;
  });
  const sub = pz + mn, iva = sub * ivaPct / 100;
  return { pz, mn, sub, iva, total: sub + iva };
}

exports.verCotizacion = asyncHandler(async (req, res) => {
  const [[c]] = await pool.query('SELECT * FROM cotizaciones WHERE approval_token=?', [req.params.token]);
  if (!c) throw new ApiError(404, 'El enlace no es válido o ya expiró.');
  const [items] = await pool.query('SELECT tipo,descripcion AS desc,cantidad AS cant,horas,costo,margen,tarifa FROM cotizacion_items WHERE cotizacion_id=?', [c.id]);
  const [[cli]] = await pool.query('SELECT nombre FROM clientes WHERE id=?', [c.cliente_id]);
  const [[veh]] = await pool.query('SELECT marca,modelo,anio,placa FROM vehiculos WHERE id=?', [c.vehiculo_id]);
  const totals = calcTotals(items, 16);
  ok(res, { folio: c.folio, estado: c.estado, notas: c.notas, cliente: cli ? cli.nombre : '',
    vehiculo: veh ? `${veh.marca} ${veh.modelo} ${veh.anio} · ${veh.placa}` : '', items, totals });
});

exports.decidir = asyncHandler(async (req, res) => {
  const { decision } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[c]] = await conn.query('SELECT * FROM cotizaciones WHERE approval_token=? FOR UPDATE', [req.params.token]);
    if (!c) throw new ApiError(404, 'El enlace no es válido.');
    if (['Aprobada', 'Rechazada', 'Pagada'].includes(c.estado)) throw new ApiError(409, 'Esta cotización ya fue respondida.');
    const nuevo = decision === 'aprobar' ? 'Aprobada' : 'Rechazada';
    await conn.query('UPDATE cotizaciones SET estado=? WHERE id=?', [nuevo, c.id]);
    if (decision === 'aprobar') await conn.query('INSERT INTO tareas (id,vehiculo_id,estado,prioridad,eta,avance) VALUES (?,?,?,?,CURDATE(),10)',
      [crypto.randomBytes(12).toString('hex'), c.vehiculo_id, 'diag', 'Alta']);
    await conn.query('INSERT INTO auditoria (id,modulo,accion,registro_id) VALUES (UUID(),?,?,?)', ['cotizaciones', 'decision-cliente', c.id]);
    await conn.commit();
    ok(res, { estado: nuevo });
  } catch (e) { await conn.rollback(); throw e; }
  finally { conn.release(); }
});