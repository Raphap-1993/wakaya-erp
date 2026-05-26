# Plantillas transversales

[README principal](../../README.md) | [Indice docs](../../docs/README.md) | [Volver a plantillas](../README.md)

Plantillas reutilizables que sirven en varias fases del proyecto.

## Plantillas disponibles
- [AI_CONTEXT.md](AI_CONTEXT.md) — estado vivo del proyecto; primer archivo que lee un agente IA.
- [PROJECT_MAP.md](PROJECT_MAP.md) — mapa de navegacion del repositorio.
- [TRACEABILITY_MATRIX.md](TRACEABILITY_MATRIX.md) — matriz global de trazabilidad.
- [GLOSSARY.md](GLOSSARY.md) — terminos del framework y del dominio.
- [SESSION_LOG.md](SESSION_LOG.md) — bitacora append-only de sesiones de trabajo del agente.
- [PROTOTYPE_HUB.md](PROTOTYPE_HUB.md) — estructura estandarizada de 10 secciones para `prototype/index.html`.
- [matriz-raci.md](matriz-raci.md)
- [ropa-registro-actividades.md](ropa-registro-actividades.md)
- [dpia-evaluacion-impacto.md](dpia-evaluacion-impacto.md)

## Archivos de contexto vivo
`AI_CONTEXT.md`, `PROJECT_MAP.md`, `TRACEABILITY_MATRIX.md` y `GLOSSARY.md` se
instancian en la raiz del proyecto (no en `plantillas/`). El agente interno los
indexa y `sync-memory` parsea `TRACEABILITY_MATRIX.md` para poblar la memoria.
Manten estos cuatro archivos vivos: son lo que evita que un agente IA pierda
contexto al retomar el proyecto.

## Regla de uso
- Usa esta carpeta para artefactos que no pertenecen a una sola fase.
- Refleja la version aplicada del proyecto en `docs/` o en el artefacto operativo correspondiente.
