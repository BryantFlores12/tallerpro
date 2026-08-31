const env = require('../config/env');

module.exports = function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const payload = { ok: false, message: err.message || 'Error interno del servidor' };
  if (env.env === 'development') payload.stack = err.stack;
  if (status >= 500) console.error(err);
  res.status(status).json(payload);
};