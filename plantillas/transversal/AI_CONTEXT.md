# AI_CONTEXT

> **Plantilla (no es el entregable).** Destino: `varios`. Consolida el entregable en la carpeta destino que indica el README de esta carpeta.

> Primer archivo que un agente IA debe leer al retomar este proyecto.
> `AGENTS.md` explica COMO debe trabajar el agente. `AI_CONTEXT.md` explica
> EN QUE ESTADO esta el proyecto AHORA. Mantenlo corto y vivo: actualizalo al
> cerrar cada fase, feature o gate.

## Identidad
- Proyecto: <nombre del proyecto>
- Dominio: <dominio de negocio>
- Stack: <stack tecnico>
- Version actual: <vX.Y.Z>

## Estado actual
- Fase activa: <0-8 / transversal>
- Resumen en una linea: <que se esta haciendo ahora>
- Ultima actualizacion: <fecha>

## Features y su estado
Ver matriz global en `TRACEABILITY_MATRIX.md`. Resumen:

| Feature | Fase | Estado | Gate bloqueante |
|---|---|---|---|
| <feature> | <fase> | <estado> | <gate pendiente o -> | 

## Gates pendientes
- <gate>: <por que esta pendiente / que falta>

## Proximos pasos
1. <accion concreta>
2. <accion concreta>

## Como cargar contexto rapido
```sh
node scripts/ai-framework-agent.mjs index-docs   # indexa Markdown + FTS5
node scripts/ai-framework-agent.mjs sync-memory  # puebla trazabilidad/gates/decisiones
node scripts/ai-framework-agent.mjs status       # estado de la memoria
node scripts/ai-framework-agent.mjs search --query "<tema>"
```
La BD `ai/memory/framework-agent.db` es un indice reconstruible. La fuente de
verdad son los Markdown. Si la BD contradice un Markdown, gana el Markdown.

## Punteros clave
- `AGENTS.md` — contrato de trabajo del agente.
- `PROJECT_MAP.md` — donde vive cada cosa.
- `TRACEABILITY_MATRIX.md` — matriz global de trazabilidad.
- `GLOSSARY.md` — terminos del framework y del dominio.
- `docs/README.md` — indice de documentacion por fase.
- `specs/` — specs por feature (spec-funcional, spec-tecnica, traceability...).

## Como actualizar este archivo
- Actualiza `Estado actual` y `Proximos pasos` al cerrar cada sesion de trabajo.
- Actualiza `Features y su estado` y `Gates pendientes` al mover un gate.
- Tras actualizar, corre `sync-memory` para reflejarlo en la memoria del agente.
