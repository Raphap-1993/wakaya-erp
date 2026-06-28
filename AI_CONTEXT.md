# AI_CONTEXT

> Primer archivo que un agente IA debe leer al retomar este proyecto.
> `AGENTS.md` explica COMO debe trabajar el agente. Este archivo explica EN QUE
> ESTADO esta el proyecto AHORA. Mantenlo corto y vivo: actualizalo al cerrar
> cada fase, feature o gate, y corre `sync-memory` despues.

## Identidad
- Proyecto: Wakaya ERP.
- Dominio: reservations.
- <!-- auto:start name=stack -->
Node >=20.0.0
<!-- auto:end -->
- Version actual: <!-- auto:start name=version -->
v0.1.0
<!-- auto:end -->

## Estado actual
- Fase activa: transicion 2 -> 5 (prototipo visual + construccion inicial).
- Resumen en una linea: `check:project`, `test`, `typecheck` y `build` ya pasan en local; el bloqueo real ahora es cerrar contrato/aprobacion humana de prototipos y decidir como resolver el tooling `roadmap:*` faltante.
- Ultima actualizacion: hardening de gobernanza minima 2026-06-03.

## Features y su estado
Ver matriz global en `TRACEABILITY_MATRIX.md`.

<!-- auto:start name=features -->
| Feature | Estado consolidado | Gates |
|---|---|---|
| 001-reservations | Bloqueado: gate-0-1 | gate-0-1=Pendiente; gate-prototype-ready=Aprobado; gate-spdd-approved=Aprobado |
| 002-public-site | Bloqueado: gate-prototype-ready | gate-prototype-ready=Pendiente; gate-spdd-approved=Pendiente |
<!-- auto:end -->

## Gates pendientes

<!-- auto:start name=gates-pendientes -->
- `gate-0-1` en `specs/001-reservations` — Pendiente (ultimo: Raphael Paredes, 2026-06-03)
- `gate-prototype-ready` en `specs/002-public-site` — Pendiente (ultimo: Raphael Paredes, 2026-06-04)
- `gate-spdd-approved` en `specs/002-public-site` — Pendiente (ultimo: Raphael Paredes, 2026-06-04)
<!-- auto:end -->

## Sesiones recientes

<!-- auto:start name=sesiones-recientes -->
- **2026-06-03 13:00** — Viernes — se ejecuto el primer slice real de hardening en lugar de seguir solo diagnosticando. `check:project` ya pasa, junto con `test`, `typecheck` y `build`. El repo deja de estar bloqueado por BD/API/constitucion/plantillas y el foco cambia a contrato/aprobacion humana de prototipos y 
- **2026-06-03 00:50** — Viernes — se re-ejecutaron los checks de gobernanza y baseline sobre el foco activo de hardening. El rerun confirma que siguen abiertos los huecos previos y agrega un problema estructural: el canon de gates publicado por docs y validadores no coincide.
- **2026-06-03 00:38** — Viernes — se revalido la gobernanza sobre el foco activo de hardening. El delta confirma que siguen abiertos los huecos del audit anterior y agrega un incumplimiento constitucional oculto por el pipeline principal.
<!-- auto:end -->

## Decisiones recientes

<!-- auto:start name=decisiones-recientes -->
- La version conectada al backend no expone inventario interno por unidad real en esta fase. _(registrada)_ — [ver](specs/002-public-site/traceability.md)
- La ruta dominante es hospedaje y prereserva manual. _(registrada)_ — [ver](specs/002-public-site/traceability.md)
- La disponibilidad referencial y la tarifa base salen del read model publico de categorias: `GET /api/public/room-categories` y `GET /api/public/room-categories/ _(registrada)_ — [ver](specs/002-public-site/traceability.md)
- Eventos y Full Day son lineas secundarias con flujo propio de solicitud. _(registrada)_ — [ver](specs/002-public-site/traceability.md)
- El prototipo aprobado alimenta campos, filtros, permisos y estados de error del API contract. _(registrada)_ — [ver](specs/001-reservations/traceability.md)
<!-- auto:end -->

<!-- auto:start name=ultima-actualizacion -->
2026-06-28 16:00
<!-- auto:end -->

## Proximos pasos
1. Completar `## Contrato del prototipo` en `specs/001-reservations/prototype-html5/decisiones-ux.md` y alinear roles/contrato visible de `002-public-site`.
2. Ejecutar revision visual humana real de ambos prototipos y mover `gate-prototype-ready` / `gate-spdd-approved` solo si hay aprobacion humana.
3. Decidir si se restaura o se retira definitivamente el set `scripts/roadmap-*` para que `npm run roadmap:audit` deje de mentir.
4. Anotar `@trace RF-XX` en codigo y tests productivos para destrabar mejor la lectura real de Fase 5.

## Como cargar contexto rapido
```sh
node scripts/ai-framework-agent.mjs index-docs
node scripts/ai-framework-agent.mjs sync-memory
node scripts/ai-framework-agent.mjs status
node scripts/ai-framework-agent.mjs search --query "<tema>"
```
La BD `ai/memory/framework-agent.db` es un indice reconstruible. La fuente de
verdad son los Markdown. Si la BD contradice un Markdown, gana el Markdown.

## Punteros clave
- `AGENTS.md` - contrato de trabajo del agente.
- `PROJECT_MAP.md` - donde vive cada cosa.
- `TRACEABILITY_MATRIX.md` - matriz global de trazabilidad.
- `GLOSSARY.md` - terminos del framework y del dominio.
- `docs/README.md` - indice de documentacion por fase.
- `specs/001-reservations/spec-funcional.md` - spec inicial de la feature.
- `docs/superpowers/plans/2026-06-02-wakaya-local-readiness-handoff.md` - handoff tecnico de la revision local.

## Como actualizar este archivo
- Actualiza `Estado actual` y `Proximos pasos` al cerrar cada sesion de trabajo.
- Actualiza `Features y su estado` y `Gates pendientes` al mover un gate.
- Tras actualizar, corre `sync-memory` para reflejarlo en la memoria del agente.
