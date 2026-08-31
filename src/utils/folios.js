module.exports = async function nextFolio(conn, tipo, prefijo) {
  await conn.query('UPDATE folios SET valor = valor + 1 WHERE tipo = ?', [tipo]);
  const [[row]] = await conn.query('SELECT valor FROM folios WHERE tipo = ?', [tipo]);
  return `${prefijo}-${row.valor}`;
};