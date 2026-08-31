const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { ApiError } = require('../utils/ApiResponse');

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new ApiError(401, 'Token de acceso requerido');
  try {
    req.user = jwt.verify(token, env.jwt.secret);
    next();
  } catch {
    throw new ApiError(401, 'Token inválido o expirado');
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.rol)) throw new ApiError(403, 'No tienes permisos para esta operación');
    next();
  };
}

module.exports = { requireAuth, requireRole };