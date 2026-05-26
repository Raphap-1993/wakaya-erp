# Ejemplo de arquitectura

## Estilo de arquitectura
Monolito modular con frontend separado, orientado a acelerar entrega inicial y mantener claridad operativa.

## Frontend
Aplicacion Angular 21 en workspace Nx con consumo de API REST, guards por rol y formularios reactivos.

## Backend
API Quarkus con modulos de registro, seguimiento, auditoria y reportes.

## Modulos canonicos del MVP
- `expedientes-consulta` para bandeja y detalle resumido.
- `expedientes-transicion` para cambio de estado con reglas de negocio.
- `expedientes-historial` para historial visible y consulta de auditoria.
- `auditoria` para historial y trazabilidad de acciones criticas.

## Base de datos
PostgreSQL con tablas de expediente, anexos, eventos de estado y auditoria.

## Seguridad
Autenticacion con Keycloak, autorizacion por roles y registro de auditoria en operaciones sensibles.

## Integraciones
- IAM corporativo via Keycloak.
- Notificaciones por correo interno.

## Contratos canonicos del MVP
- `GET /api/expedientes`
- `GET /api/expedientes/{id}`
- `GET /api/expedientes/{id}/historial`
- `PATCH /api/expedientes/{id}/estado`

## Observabilidad
- Logs estructurados.
- Metricas de API y base de datos.
- Trazas basicas para operaciones criticas.

## Despliegue
Frontend Angular construido desde Nx y servido detras de Nginx, backend en contenedor Java y PostgreSQL administrado en servidores Linux on-premise.

## Trazabilidad canonica
- `001-bandeja-trabajo-expedientes` consume los contratos `GET`.
- `002-cambio-estado-expediente` consume el contrato `PATCH` y exige auditoria transaccional.
- `003-historial-auditoria-expediente` consume el contrato `GET /historial` y hace visible la trazabilidad.
