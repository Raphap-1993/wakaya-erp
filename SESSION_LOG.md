# SESSION_LOG

> Bitacora append-only de sesiones de trabajo del agente IA y del equipo.
> Cada sesion deja un registro estructurado: que cambio, que quedo pendiente,
> con que links de evidencia. `sync-memory` parsea este archivo y puebla
> `ai_session_events`.

## Reglas
- Append-only; cronologico descendente (la mas reciente arriba).
- Formato de entrada (parser regex):
  - `## <YYYY-MM-DD HH:MM> — <Titulo>`
  - `- Agente:`, `- Resumen:`, `- Cambios:`, `- Pendiente:`, `- Evidencia:`.

## Entradas

## 2026-05-26 05:32 — Instanciacion inicial de Wakaya ERP
- Agente: template-generator
- Resumen: proyecto recien instanciado desde el template. Pendiente validar vision y requerimientos.
- Cambios:
  - Estructura base (docs/, specs/, ai/, src/, tests/, qa/, ops/)
  - Spec inicial `specs/001-reservations/`
- Pendiente:
  - Validar vision y requerimientos con el negocio (gate-0-1)
  - Generar Product Design y SPDD de 001-reservations
- Evidencia:
  - Markdown de fases 0-8 generados por scripts/ai-framework-agent.mjs
