# AI_CONTEXT

> Primer archivo que un agente IA debe leer al retomar este proyecto.
> `AGENTS.md` explica COMO debe trabajar el agente. Este archivo explica EN QUE
> ESTADO esta el proyecto AHORA. Mantenlo corto y vivo: actualizalo al cerrar
> cada fase, feature o gate, y corre `sync-memory` despues.

## Identidad
- Proyecto: Wakaya ERP.
- Dominio: reservations.
- <!-- auto:start name=stack -->Stack: node-next<!-- auto:end -->
- Version actual: <!-- auto:start name=version -->v0.1.0<!-- auto:end -->

## Estado actual
- Fase activa: 0 - iniciacion.
- Resumen en una linea: proyecto recien instanciado desde el template; pendiente validar vision y requerimientos.
- Ultima actualizacion: instanciacion inicial.

## Features y su estado
Ver matriz global en `TRACEABILITY_MATRIX.md`.

<!-- auto:start name=features -->
| Feature | Fase | Estado | Gate bloqueante |
|---|---|---|---|
| 001-reservations | 0-1 | Spec inicial generada | gate-0-1 |
<!-- auto:end -->

## Gates pendientes

<!-- auto:start name=gates-pendientes -->
- gate-0-1: validar vision y requerimientos con el negocio.
- gate-ux-ready: product-design.md requiere validacion humana.
- gate-spdd-approved: prototipo requiere validacion antes de SDD.
<!-- auto:end -->

## Sesiones recientes

<!-- auto:start name=sesiones-recientes -->
- _(sin entradas en SESSION_LOG.md)_
<!-- auto:end -->

## Decisiones recientes

<!-- auto:start name=decisiones-recientes -->
- _(sin ADR / decisiones registradas)_
<!-- auto:end -->

<!-- auto:start name=ultima-actualizacion -->
_Ultima regeneracion: pendiente (corre `npm run memory:context`)._
<!-- auto:end -->

## Proximos pasos
1. Validar vision y requerimientos (fase 0-1).
2. Generar Product Design y SPDD para 001-reservations.
3. Prototipar la feature visual con `/prototype --mode html5`.

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

## Como actualizar este archivo
- Actualiza `Estado actual` y `Proximos pasos` al cerrar cada sesion de trabajo.
- Actualiza `Features y su estado` y `Gates pendientes` al mover un gate.
- Tras actualizar, corre `sync-memory` para reflejarlo en la memoria del agente.
