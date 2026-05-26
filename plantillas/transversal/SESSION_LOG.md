# SESSION_LOG

> **Plantilla (no es el entregable).** Destino: `varios`. Consolida el entregable en la carpeta destino que indica el README de esta carpeta.

> Bitacora append-only de sesiones de trabajo del agente IA y del equipo.
> Cada sesion deja un registro estructurado: que cambio, que quedo pendiente,
> con que links de evidencia. El agente siguiente lee las ultimas entradas
> primero — es lo que evita que un proyecto pierda continuidad.
> `sync-memory` parsea este archivo y puebla `ai_session_events`.

## Reglas
- Append-only: nunca borres entradas anteriores; corrige con una entrada nueva.
- Una entrada por sesion (o por cambio significativo cuando una sesion produce varios hitos).
- Mantenlo cronologico descendente (la mas reciente arriba).
- Cada entrada DEBE usar el formato exacto de abajo para que el parser la lea.

## Formato de entrada
```md
## <YYYY-MM-DD HH:MM> — <Titulo corto de la sesion>
- Agente: <nombre o role del agente / humano>
- Resumen: <una linea de que se hizo>
- Cambios:
  - <archivo o area>
  - <archivo o area>
- Pendiente:
  - <que queda abierto y para quien>
- Evidencia:
  - <ruta a commits, PR, archivos>
```

## Entradas

## 2026-01-01 09:00 — Instanciacion inicial
- Agente: template-generator
- Resumen: proyecto recien instanciado desde el template.
- Cambios:
  - Estructura base (docs/, specs/, ai/, src/, tests/, qa/, ops/)
  - Spec inicial generado
- Pendiente:
  - Validar vision y requerimientos con el negocio (gate-0-1)
  - Generar Product Design y SPDD de la feature inicial
- Evidencia:
  - Markdown de fases 0-8
