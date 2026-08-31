const pool = require('../config/db');
const { ok } = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

exports.resumen = asyncHandler(async (req, res) => {
  const isAdmin = req.user.rol === 'admin';
  const [[activas]] = await pool.query("SELECT COUNT(*) n FROM ordenes WHERE estado='Activa'");
  const [[porAprobar]] = await pool.query("SELECT COUNT(*) n FROM cotizaciones WHERE estado='Enviada'");
  const [[bajoStock]] = await pool.query('SELECT COUNT(*) n FROM inventario WHERE stock <= stock_min');
  let saldos = null;
  if (isAdmin) {
    const [[s]] = await pool.query(
      `SELECT COALESCE(SUM(total - pagado),0) AS saldo FROM (
         SELECT c.id,
           SUM(CASE WHEN i.tipo='pieza' THEN i.costo*(1+i.margen/100)*i.cantidad ELSE i.horas*i.tarifa END)*1.16 AS total,
           COALESCE((SELECT SUM(p.monto) FROM pagos p WHERE p.cotizacion_id=c.id),0) AS pagado
         FROM cotizaciones c JOIN cotizacion_items i ON i.cotizacion_id=c.id GROUP BY c.id) x`);
    saldos = s.saldo;
  }
  ok(res, { ordenesActivas: activas.n, cotizacionesPorAprobar: porAprobar.n, alertasStock: bajoStock.n, saldosPendientes: saldos });
});