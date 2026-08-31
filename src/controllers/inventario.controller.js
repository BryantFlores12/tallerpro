const crypto = require('crypto');
const pool = require('../config/db');
const { ok, ApiError } = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const id = () => crypto.randomBytes(12).toString('hex');

exports.listar = asyncHandler(async (req, res) => {
  const q = (req.query.q || '').trim();
  const [rows] = await pool.query('SELECT * FROM inventario WHERE nombre LIKE ? OR sku LIKE ? OR categoria LIKE ? ORDER BY nombre',
    [`%${q}%`, `%${q}%`, `%${q}%`]);
  ok(res, rows);
});

exports.bajoStock = asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM inventario WHERE stock <= stock_min ORDER BY stock');
  ok(res, rows);
});

exports.movimiento = asyncHandler(async (req, res) => {
  const { parte_id, tipo, cantidad, motivo, vehiculo_id, orden_id } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[parte]] = await conn.query('SELECT stock FROM inventario WHERE id=? FOR UPDATE', [parte_id]);
    if (!parte) throw new ApiError(404, 'Refacción no encontrada');
    const delta = tipo === 'entrada' ? cantidad : -cantidad;
    if (parte.stock + delta < 0) throw new ApiError(400, 'Salida mayor al stock disponible');
    await conn.query('UPDATE inventario SET stock = stock + ? WHERE id=?', [delta, parte_id]);
    await conn.query('INSERT INTO movimientos_inventario (id,parte_id,tipo,cantidad,motivo,vehiculo_id,orden_id,usuario_id) VALUES (UUID(),?,?,?,?,?,?,?)',
      [parte_id, tipo, cantidad, motivo, vehiculo_id || null, orden_id || null, req.user.sub]);
    if (tipo === 'salida' && motivo === 'Instalación en vehículo' && vehiculo_id) {
      const [[inv]] = await conn.query('SELECT lote FROM inventario WHERE id=?', [parte_id]);
      await conn.query('INSERT INTO trazabilidad (id,parte_id,lote,vehiculo_id,orden_id,fecha,garantia) VALUES (?,?,?,?,?,CURDATE(),?)',
        [id(), parte_id, inv.lote, vehiculo_id, orden_id || null, 'Vigente']);
    }
    await conn.commit();
    ok(res, { aplicado: true });
  } catch (e) { await conn.rollback(); throw e; }
  finally { conn.release(); }
});

exports.trazabilidad = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT t.*, i.nombre AS parte, i.sku, v.marca, v.modelo, v.anio, v.vin, v.placa, o.folio
     FROM trazabilidad t JOIN inventario i ON i.id=t.parte_id JOIN vehiculos v ON v.id=t.vehiculo_id
     LEFT JOIN ordenes o ON o.id=t.orden_id ORDER BY t.fecha DESC`);
  ok(res, rows);
});