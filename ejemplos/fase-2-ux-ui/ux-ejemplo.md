# Ejemplo de UX/UI

## Usuarios
- Operador: registra y actualiza expedientes.
- Supervisor: revisa pendientes y aprueba cierres.
- Auditor: consulta historial y evidencias.

## User journeys
- Consulta por filtros con acceso rápido al detalle.
- Cambio de estado desde el detalle con validaciones por rol.
- Revisión de historial desde el detalle del expediente.
- Revision de auditoria visible por parte del auditor.

## Mapa de pantallas
- Login
- Dashboard
- Bandeja de expedientes
- Registro de expediente
- Detalle de expediente
- Historial y auditoría
- Reportes

## Wireframes
- Bandeja con filtros laterales y tabla principal.
- Vista detalle con resumen, historial reciente y acciones de estado.
- Modal o panel de confirmacion para cambio de estado con motivo y evidencia cuando aplique.

## Prototipo navegable
- Flujo validado de bandeja a detalle.
- Flujo validado de cambio de estado.

## Validación con negocio
- Aprobado por operaciones.
- Ajuste resuelto en nomenclatura de estados: `Registrado`, `En revision`, `Cerrado`.
- Confirmada necesidad de auditoría visible en el detalle.

## Flujo de transformacion recomendado
- El resumen UX puede nacer en Markdown desde Product Owner.
- Luego puede estructurarse con IA para ordenar pantallas, estados y componentes.
- Despues puede pasar a Penpot para validacion visual y prototipo clickable.
- Si el proyecto necesita exploracion ejecutable, el siguiente paso recomendado es Angular Mock en Nx con `signals`.
- Ver ejemplo dedicado en [ux-markdown-a-angular-mock.md](ux-markdown-a-angular-mock.md).

## Trazabilidad canonica
- `HU-02` -> bandeja, filtros y detalle.
- `HU-03` -> acciones de estado en el detalle.
- `HU-04` -> historial visible y auditoria legible desde el detalle.
- Features relacionadas: `001-bandeja-trabajo-expedientes`, `002-cambio-estado-expediente` y `003-historial-auditoria-expediente`.

