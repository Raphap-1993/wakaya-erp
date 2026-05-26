# Flujo - Prototype HTML5 ejemplo

## Journey principal
Login -> Dashboard -> Configuracion de filtros -> Confirmacion -> Estado job -> Historial -> Descarga mock -> Auditoria.

## Estados cubiertos
- Success: dashboard, historial y auditoria.
- Loading/progress: seguimiento del job.
- Error/validacion: rango de fechas invalido.
- Empty: debe agregarse en proyectos donde la busqueda pueda no devolver resultados.
- Permission denied: rol `sin_permiso` y auditoria bloqueada para operador.

## Roles
- Admin: puede operar y auditar.
- Operador: genera y descarga reportes mock.
- Auditor: revisa auditoria.
- Sin permiso: ve acceso denegado.

## Feedback UX
- Modal de confirmacion.
- Toast de notificacion.
- Barra de progreso.
- Breadcrumb y menu lateral.

