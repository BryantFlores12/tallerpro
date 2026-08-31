const app = require('./app');
const env = require('./config/env');

app.listen(env.port, () => {
  console.log(`🔧 TallerPro API corriendo en http://localhost:${env.port} [${env.env}]`);
});