const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../config/db');
const env = require('../config/env');
const { ok, ApiError } = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const [[user]] = await pool.query(
    'SELECT id, nombre, email, password_hash, rol, puesto, color, activo FROM usuarios WHERE email = ?', [email]);
  if (!user || !user.activo) throw new ApiError(401, 'Credenciales inválidas');
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw new ApiError(401, 'Credenciales inválidas');
  const payload = { sub: user.id, nombre: user.nombre, rol: user.rol };
  const token = jwt.sign(payload, env.jwt.secret, { expiresIn: env.jwt.expires });
  await pool.query('INSERT INTO auditoria (id,usuario_id,modulo,accion,registro_id) VALUES (UUID(),?,?,?,?)',
    [user.id, 'auth', 'login', user.id]);
  ok(res, { token, usuario: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol, puesto: user.puesto, color: user.color } });
});

exports.crearUsuario = asyncHandler(async (req, res) => {
  const { nombre, email, password, rol, puesto, color } = req.body;
  const hash = await bcrypt.hash(password, env.bcryptRounds);
  const id = crypto.randomBytes(12).toString('hex');
  await pool.query('INSERT INTO usuarios (id,nombre,email,password_hash,rol,puesto,color) VALUES (?,?,?,?,?,?,?)',
    [id, nombre, email, hash, rol, puesto, color || '#64748b']);
  ok(res, { id, nombre, email, rol }, 201);
});