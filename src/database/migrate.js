require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
const env = require('../config/env');

(async () => {
  const confirmed = process.argv.includes('--confirm-reset');
  const runSeed = process.argv.includes('--seed');

  if (!confirmed) {
    throw new Error('Operación cancelada: usa --confirm-reset para autorizar el reemplazo completo de la base de datos.');
  }

  if (!/^[A-Za-z0-9_]+$/.test(env.db.name)) {
    throw new Error('DB_NAME solo puede contener letras, números y guiones bajos.');
  }

  const seedPassword = process.env.SEED_PASSWORD || '';
  if (runSeed && seedPassword.length < 12) {
    throw new Error('SEED_PASSWORD debe contener al menos 12 caracteres al cargar datos de demostración.');
  }

  const root = await mysql.createConnection({
    host: env.db.host, port: env.db.port, user: env.db.user,
    password: env.db.password, multipleStatements: true
  });

  console.log(`→ Reiniciando la base de datos ${env.db.name}...`);
  await root.query(`DROP DATABASE IF EXISTS \`${env.db.name}\``);
  await root.query(`CREATE DATABASE \`${env.db.name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await root.query(`USE \`${env.db.name}\``);

  console.log('→ Ejecutando schema.sql...');
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await root.query(schema);

  if (runSeed) {
    console.log('→ Insertando datos semilla...');
    const seed = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');
    await root.query(seed);
    const hash = await bcrypt.hash(seedPassword, env.bcryptRounds);
    const usuarios = [
      ['u1', 'Mariana Torres', 'gerencia@tallerpro.mx', 'admin', 'Gerente / Administradora', '#f97316'],
      ['u2', 'Carlos Peña', 'recepcion@tallerpro.mx', 'recepcion', 'Recepción y caja', '#2e90fa'],
      ['u3', 'Luis Herrera', 'taller@tallerpro.mx', 'mecanico', 'Técnico especialista', '#12b76a'],
      ['u4', 'Sofía Aguilar', 'diagnostico@tallerpro.mx', 'mecanico', 'Técnica en diagnóstico', '#7a5af8']
    ];
    for (const [id, nombre, email, rol, puesto, color] of usuarios) {
      await root.query(
        'INSERT INTO usuarios (id,nombre,email,password_hash,rol,puesto,color) VALUES (?,?,?,?,?,?,?)',
        [id, nombre, email, hash, rol, puesto, color]);
    }
  }

  await root.end();
  console.log('✅ Migración completada.');
})().catch(e => { console.error('❌ Error:', e.message); process.exit(1); });
