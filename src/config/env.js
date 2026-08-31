require('dotenv').config();

const nodeEnv = process.env.NODE_ENV || 'development';
const required = ['DB_USER', 'DB_PASSWORD', 'JWT_SECRET'];
const missing = required.filter((name) => !process.env[name]);

if (missing.length) {
  throw new Error(`Faltan variables de entorno requeridas: ${missing.join(', ')}`);
}

if (process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET debe contener al menos 32 caracteres.');
}

const bcryptRounds = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);
if (!Number.isInteger(bcryptRounds) || bcryptRounds < 10 || bcryptRounds > 15) {
  throw new Error('BCRYPT_ROUNDS debe ser un entero entre 10 y 15.');
}

module.exports = {
  port: parseInt(process.env.PORT || '4000', 10),
  env: nodeEnv,
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    name: process.env.DB_NAME || 'tallerpro'
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expires: process.env.JWT_EXPIRES || '8h'
  },
  bcryptRounds,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:4000'
};
