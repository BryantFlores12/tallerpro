# TallerPro

[![CI](https://github.com/BryantFlores12/tallerpro/actions/workflows/ci.yml/badge.svg)](https://github.com/BryantFlores12/tallerpro/actions/workflows/ci.yml)

Sistema web para la operación diaria de un taller mecánico. Centraliza clientes, vehículos, órdenes de servicio, diagnósticos, inventario, cotizaciones, aprobaciones, tareas y métricas en una API Express con interfaz web integrada.

## Funcionalidades

- Autenticación JWT y roles de administrador, recepción y mecánico.
- Expedientes de clientes y vehículos.
- Órdenes de servicio con inspección, firma y seguimiento.
- Bitácora técnica con mediciones, evidencias y diagnóstico.
- Inventario, movimientos y trazabilidad de refacciones.
- Cotizaciones con partidas, impuestos y aprobación mediante enlace.
- Planeación de tareas y tablero operativo.
- Auditoría de operaciones y folios consecutivos.
- Interfaz web servida desde la misma aplicación.

## Stack

| Área | Tecnología |
| --- | --- |
| Runtime | Node.js 20+ |
| API | Express 4 |
| Base de datos | MySQL 8 y `mysql2` |
| Seguridad | Helmet, CORS, rate limiting, JWT y bcrypt |
| Validación | express-validator |
| Desarrollo | Nodemon |

## Requisitos

- Node.js 20 o superior.
- MySQL 8 o compatible.
- Una cuenta de MySQL con permiso para crear y eliminar la base configurada.

## Inicio rápido

```bash
npm ci
copy .env.example .env
npm run db:reset:seed
npm run dev
```

En macOS o Linux, reemplaza `copy` por `cp`. Abre `http://localhost:4000` cuando el servidor esté listo.

Antes de ejecutar `db:reset:seed`, cambia `DB_PASSWORD`, `JWT_SECRET` y `SEED_PASSWORD`. La contraseña semilla se aplica a las cuentas de demostración y nunca debe reutilizarse en producción.

## Variables de entorno

| Variable | Descripción |
| --- | --- |
| `PORT` | Puerto HTTP; predeterminado `4000` |
| `NODE_ENV` | Entorno de ejecución |
| `DB_HOST`, `DB_PORT` | Conexión al servidor MySQL |
| `DB_USER`, `DB_PASSWORD` | Credenciales de MySQL |
| `DB_NAME` | Base de datos administrada por TallerPro |
| `JWT_SECRET` | Secreto aleatorio de al menos 32 caracteres |
| `JWT_EXPIRES` | Vigencia de los tokens |
| `BCRYPT_ROUNDS` | Coste de bcrypt, entre 10 y 15 |
| `FRONTEND_URL` | Origen permitido por CORS |
| `SEED_PASSWORD` | Contraseña temporal para datos de demostración |

El proyecto valida la configuración al iniciar y rechaza secretos JWT débiles o variables obligatorias ausentes.

## Comandos

```bash
npm run dev             # servidor con recarga automática
npm start               # servidor de producción
npm run db:reset        # elimina y recrea la base configurada
npm run db:reset:seed   # reinicia y agrega datos de demostración
npm run audit           # revisa vulnerabilidades de producción
```

> **Advertencia:** los comandos `db:reset*` son destructivos. Eliminan por completo la base indicada en `DB_NAME` antes de crear el esquema.

## API

La API está disponible bajo `/api`:

| Ruta | Responsabilidad |
| --- | --- |
| `/api/auth` | Inicio de sesión y usuarios |
| `/api/clientes` | Clientes |
| `/api/vehiculos` | Vehículos |
| `/api/ordenes` | Órdenes de servicio |
| `/api/bitacora` | Diagnóstico y evidencias |
| `/api/inventario` | Existencias y movimientos |
| `/api/cotizaciones` | Cotizaciones y pagos |
| `/api/tareas` | Planeación del taller |
| `/api/dashboard` | Indicadores operativos |
| `/api/public` | Aprobaciones públicas por token |
| `/api/health` | Estado del servicio |

## Seguridad

- `.env`, logs y dependencias instaladas están excluidos de Git.
- Las contraseñas se almacenan con bcrypt.
- Las rutas privadas validan JWT y roles.
- El inicio de sesión cuenta con limitación de intentos.
- Las consultas usan parámetros preparados.
- Las aprobaciones públicas utilizan tokens aleatorios y decisiones de un solo uso.

Revisa `SECURITY.md` antes de desplegar y coloca la aplicación detrás de HTTPS en producción.

## Estructura

```text
src/
├── config/       # entorno y conexión MySQL
├── controllers/  # lógica de negocio
├── database/     # esquema, datos demo e inicialización
├── middleware/   # autenticación, validación y errores
├── public/       # interfaz web
├── routes/       # endpoints Express
└── utils/        # respuestas, folios y utilidades
```

## Licencia

Proyecto privado. No se concede permiso de redistribución o uso comercial por terceros salvo autorización expresa del propietario.
