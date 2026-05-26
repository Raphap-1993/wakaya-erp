> **Plantilla (no es el entregable).** Destino: `specs/<feature>/`. Fuente unica: `npm run scaffold:feature` (genera el archivo real con el slug). Regenera esta plantilla con `npm run plantillas:sync` — NO la edites a mano.

# Spec funcional - <Titulo de la feature>

## Origen
- Backlog item: `HU-NN <descripcion corta de la historia de usuario>`
- Requerimientos relacionados: `RF-NN`, `RNF-NN`
- Product Design: `product-design.md`
- SPDD aprobado: `spdd-frontend.md`, `prototype-validation.md`

## Objetivo
<Una frase clara que describa que problema resuelve esta feature para el usuario final.>

## Requerimientos

- **RF-NN**: <descripcion del comportamiento observable>
- **RNF-NN**: <restriccion no funcional, ej. latencia p95 <= Xms o disponibilidad >= 99.9%>

## Reglas de negocio

- <Regla 1 — invariante del dominio>
- <Regla 2 — caso borde>
- <Regla 3 — autorizacion/permisos>

## Actores

| Actor | Permisos | Caso de uso principal |
|---|---|---|
| <Rol-A> | <leer/crear/editar/aprobar> | <accion principal> |
| <Rol-B> | <permisos> | <accion> |

## Criterios de aceptacion

- [ ] Dado <precondicion>, cuando <accion>, entonces <resultado>.
- [ ] Dado <precondicion>, cuando <error>, entonces <feedback al usuario>.
- [ ] La auditoria registra correlationId, rol y operacion.

## Fuera de alcance
- <Lo que NO se hace en esta iteracion (mover a backlog futuro).>
