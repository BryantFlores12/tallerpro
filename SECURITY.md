# Seguridad de TallerPro

## Antes de producción

- Genera valores únicos para `DB_PASSWORD`, `JWT_SECRET` y cualquier contraseña de usuario.
- Usa HTTPS y restringe el acceso directo a MySQL.
- Configura `FRONTEND_URL` con el origen exacto de producción.
- No ejecutes `db:reset` ni `db:reset:seed` contra una base con datos reales.
- Cambia o elimina todas las cuentas de demostración.
- Aplica copias de seguridad cifradas y prueba su restauración.
- Revisa límites de carga, retención de evidencias y permisos por rol.
- Mantén activas las alertas de Dependabot y la integración continua.

## Reportes

Reporta vulnerabilidades de forma privada al propietario del repositorio. No incluyas credenciales, datos de clientes ni información de vehículos en issues públicos.
