# AI

[README principal](../README.md) | [Indice docs](../docs/README.md)

Carpeta base para artefactos AI-first del repositorio.

## Estructura
- `agents/` define roles especializados de IA por dominio o fase.
- `prompts/` contiene instrucciones reutilizables para pedir salidas concretas.
- `skills/` concentra capacidades reutilizables para producir o revisar trabajo.
- `commands/` materializa el lifecycle mental `/document`, `/plan`, `/ux`, `/prototype`, `/spec`, `/build`, `/test`, `/review`, `/ship`.
- `quality-gates/` convierte los gates del repo en artefactos AI-first reutilizables.
- `references/` agrupa checklists y criterios cortos para cargar segun la tarea.
- `memory/` define memoria local portable para indice, busqueda semantica y analitica opcional.
- `runbooks/` documenta flujos operativos completos, como crear un proyecto real en otra ruta.
- `external-agent-skills.md` mapea patrones externos al modelo local.
- `ejemplos/` muestra como usar agentes, prompts y skills sobre el caso canonico.

## Flujo de uso recomendado
1. Lee `../docs/transversal/90.00-estandar-ia.md`.
2. Lee `../docs/transversal/90.12-mapa-ia-por-fase.md`.
3. Si partes de una idea cruda, revisa `../docs/fase-0-iniciacion/00.10-idea-a-documentacion-inicial-con-ia.md`.
4. Para convertir esa idea en borradores iniciales, usa `prompts/transformar-idea-a-documentacion-inicial.md`.
5. Si no esta claro que cargar, usa `agents/enterprise-ai-framework-agent.md` o `skills/using-project-skills.skill.md` para enrutar la intencion del trabajo.
6. Si quieres crear un proyecto real en otra ruta, usa `runbooks/crear-proyecto-real-con-agente.md` y `../scripts/ai-framework-agent.mjs`.
7. Si prefieres pensar por lifecycle, elige primero un comando desde `commands/`.
8. Carga solo las referencias minimas necesarias desde `references/`.
9. Usa el `quality gate` de la fase si el trabajo ya esta cerca de aprobacion o release.
10. Identifica si despues necesitas un `agent`, un `prompt` o una `skill` mas especifica.
11. Revisa `ejemplos/README.md` si quieres ver el caso canonico aplicado.
12. Lleva siempre la salida final a una ruta canonica del repositorio.

## Compatibilidad
- Esta carpeta no depende de un solo proveedor o herramienta.
- Puede usarse con cualquier agente capaz de leer markdown, seguir instrucciones y producir cambios sobre el repositorio.
- Si una herramienta entiende mejor prompts, agents o skills por separado, usa la estructura que mejor encaje sin romper trazabilidad.

## Diferencia practica
- Usa `agent` cuando necesitas una salida completa por rol.
- Usa `prompt` cuando ya sabes el entregable puntual que quieres producir.
- Usa `skill` cuando quieres repetir una forma de trabajo o revision.
- Usa `command` cuando quieres entrar por lifecycle de ejecucion.
- Usa `quality gate` cuando necesitas validar readiness por fase.
- Usa `reference` cuando solo necesitas criterio reusable o una checklist corta.
- Usa `memory` cuando necesitas buscar, relacionar o auditar contexto local sin reemplazar los archivos oficiales.
- Usa `../scripts/ai-framework-agent.mjs` cuando necesitas ejecutar la parte operacional del agente interno.

## Anatomia minima esperada
- `Agent`: objetivo, usalo cuando, no lo uses cuando, entradas minimas, salidas, rutas y verificacion.
- `Prompt`: objetivo, usalo cuando, no lo uses cuando, entradas, salida, rutas, verificacion y pedido base.
- `Skill`: objetivo, aplicala cuando, no la apliques cuando, flujo, anti-rationalizations, red flags, verification evidence y referencias.

La guia oficial vive en `../docs/transversal/90.28-anatomia-operativa-de-agents-prompts-skills.md`.

## Regla de consistencia
- Ningun artefacto de IA debe dejar texto huerfano fuera de `docs/`, `specs/`, `src/`, `tests/`, `qa/` u `ops/`.
- Toda salida debe declarar entradas minimas y rutas destino.
- Si cambia arquitectura o tecnologia, debe reflejarse en fase 3 o en un ADR.

## Uso en proyecto real
- `ai/agents/`, `ai/prompts/` y `ai/skills/` deben reflejar el contexto real del proyecto adoptado.
- `ai/ejemplos/` sirve solo como referencia de forma y profundidad, no como contenido para copiar.
- Si el proyecto cambia dominio, stack, actores o fases relevantes, esos cambios deben verse en los artefactos oficiales de `ai/`.

## Estructura sugerida cuando la capa de IA crece
```text
ai/
  README.md
  agents/
    README.md
    planner-agent.md
    architect-agent.md
    agentes-proyecto-real/
  prompts/
    README.md
    estimar-proyecto.md
    prompts-proyecto-real/
  skills/
    README.md
    architecture.skill.md
    skills-proyecto-real/
  commands/
    README.md
    plan-command.md
    ux-command.md
    prototype-command.md
    spec-command.md
  quality-gates/
    README.md
    gate-4-6.md
  references/
    README.md
    quality-release-and-operations.md
  memory/
    README.md
    schema-sqlite.sql
  runbooks/
    README.md
    crear-proyecto-real-con-agente.md
  external-agent-skills.md
  ejemplos/
    README.md
```

## Anti-patron a evitar
- No copiar ejemplos canonicos como si ya fueran artefactos oficiales del proyecto.
- No dejar agentes, prompts o skills hablando de otro dominio distinto al proyecto adoptado.
- No usar la carpeta `ejemplos/` como reemplazo de una capa real de IA.
- No cargar todas las referencias o skills "por si acaso"; usa solo las minimas.

## Navegacion
- [agents/README.md](agents/README.md)
- [prompts/README.md](prompts/README.md)
- [skills/README.md](skills/README.md)
- [commands/README.md](commands/README.md)
- [quality-gates/README.md](quality-gates/README.md)
- [references/README.md](references/README.md)
- [memory/README.md](memory/README.md)
- [runbooks/README.md](runbooks/README.md)
- [external-agent-skills.md](external-agent-skills.md)
- [ejemplos/README.md](ejemplos/README.md)
