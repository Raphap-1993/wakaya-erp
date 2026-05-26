# Gate SPDD Approved

## Objetivo
Validar que una feature visual tiene experiencia y prototipo aprobados antes de cerrar SDD final o pasar a construccion front/back.

## Regla
Ninguna feature visual pasa a SDD final ni construccion si no tiene prototipo validado o una decision explicita de no requerirlo.

`gate-prototype-ready` debe estar listo o justificado antes de pedir este gate. `gate-spdd-approved` exige validacion humana registrada.

## Evidencia minima
- spec funcional inicial,
- flujo UX,
- prototipo validado o excepcion documentada,
- resultado de `gate-prototype-ready`,
- validacion de prototipo,
- estados UI,
- componentes principales,
- validaciones visibles,
- criterios de aceptacion UI,
- diferencias por rol/perfil y restricciones de acceso documentadas,
- observaciones resueltas o aceptadas,
- trazabilidad Product Design -> SPDD -> SDD.

## Bloqueantes
- prototipo no aprobado,
- prototipo solo en prompt, sin ruta/link/export revisable,
- flujo sin actor,
- pantalla sin estados,
- validaciones no definidas,
- restricciones de acceso no definidas,
- divergencia entre spec y prototipo,
- observaciones abiertas sin decision.

## Resultado esperado
- `Aprobado`
- `Aprobado con observaciones aceptadas`
- `Bloqueado`

## Rutas esperadas por feature
- `specs/<feature>/product-design.md`
- `specs/<feature>/spdd-frontend.md`
- `specs/<feature>/prototype.md`
- `specs/<feature>/prototype-validation.md`
- `specs/<feature>/traceability.md`

## Referencias
- `../references/product-design-workflow.md`
- `../references/frontend-spdd-workflow.md`
- `../../docs/transversal/90.34-product-design-y-spdd-frontend.md`
