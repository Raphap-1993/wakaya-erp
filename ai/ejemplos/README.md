# Ejemplos de IA

[README principal](../../README.md) | [Indice docs](../../docs/README.md) | [Volver a ai](../README.md)

## Contenido
- [guia-prompts-por-escenario.md](guia-prompts-por-escenario.md)
- [agents-caso-canonico.md](agents-caso-canonico.md)
- [idea-a-documentacion-inicial.md](idea-a-documentacion-inicial.md)
- [prompts-caso-canonico.md](prompts-caso-canonico.md)
- [routing-por-intencion.md](routing-por-intencion.md)
- [skills-caso-canonico.md](skills-caso-canonico.md)
- [runbooks/README.md](runbooks/README.md)

## Caso base
Todos los ejemplos usan el mismo caso canonico del repositorio:
- `001-bandeja-trabajo-expedientes`
- `002-cambio-estado-expediente`
- `003-historial-auditoria-expediente`

## Regla de uso
- Usa estos ejemplos para entender como aterrizar IA sobre rutas reales del repo.
- No sustituyen el estandar definido en `docs/transversal/90.00-estandar-ia.md`.
- No deben copiarse como artefactos oficiales de un proyecto adoptado.

## Uso correcto al adoptar la plantilla
- Lee estos ejemplos para entender estructura, tono y nivel de detalle.
- Si quieres ver el paso previo a discovery formal, revisa `idea-a-documentacion-inicial.md`.
- Si quieres ver como elegir `skill` y `prompt` segun la intencion del trabajo, revisa `routing-por-intencion.md`.
- Si buscas ejemplos de runbooks, revisa `runbooks/README.md`; los runbooks operativos oficiales viven en `../runbooks/`.
- Luego crea o adapta los artefactos reales en `ai/agents/`, `ai/prompts/` y `ai/skills/` segun el dominio del proyecto.
- Si el proyecto ya no usa el caso canonico, elimina toda referencia residual antes de considerar oficial un artefacto de IA.
