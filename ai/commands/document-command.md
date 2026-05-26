# Command `/document`

## Objetivo
Guiar y producir documentacion formal del proyecto usando fases, plantillas, agents, prompts, skills, references, quality gates y rutas canonicas.

`/document` es la entrada recomendada cuando el usuario no sabe por donde empezar o cuando trae informacion en bruto. No reemplaza `/plan` ni `/spec`; los puede combinar segun la fase detectada.

## Fases donde aplica mejor
- `0 - Iniciacion`
- `1 - Analisis y requerimientos`
- `2 - UX/UI`
- `3 - Arquitectura`
- `4 - Spec-Driven Development (SDD)`
- transversalmente cuando se necesita ordenar informacion.

## Required inputs
- idea, requerimiento, necesidad o fuente escrita,
- fase conocida o inferida,
- artefactos existentes si aplica,
- ruta destino si se debe crear o actualizar un archivo.

## Process
1. Identificar la fase.
2. Detectar modo de trabajo: exploratorio o estructurado.
3. Revisar entregables minimos.
4. Hacer preguntas minimas.
5. Elegir plantilla o artefacto destino.
6. Crear o actualizar artefactos.
7. Validar con gate.
8. Registrar trazabilidad.
9. Recomendar siguiente paso.

## Diferencia critica con `/ux`
`/document` formaliza informacion que ya existe o se va aclarando: vision, requerimientos, decisiones, ADR, fases. Su salida son artefactos documentales canonicos.

`/ux` produce Product Design y SPDD: decide que experiencia necesita el usuario y la valida con prototipo. Su salida es algo mostrable antes de construir.

`/document` puede alimentar Fase 2, pero no puede reemplazar `/ux`. Si la necesidad implica experiencia visual, journeys, pantallas o prototipo, la entrada correcta es `/ux`.

## Intake como entrada, no como comando separado
Si el usuario ya tiene notas, ideas o necesidades en un archivo, usa `/document` con esa fuente:

```text
/document --source intake/necesidades-iniciales.md
```

No existe un `/intake` separado para evitar duplicar la entrada de idea inicial. El modo mas completo es `/document`, que soporta conversacion guiada y archivo fuente.

## Anti-rationalizations
| Excusa | Respuesta |
|---|---|
| Es solo para entender | Entonces debe quedar como supuesto o pregunta abierta |
| Luego lo paso al documento | El valor esta en formalizar ahora |
| No se la fase | El agente debe inferirla y declararla |
| Es un intake plano | El intake es fuente; el resultado debe vivir en rutas canonicas |

## Red flags
- No hay archivo destino.
- No hay fase detectada.
- Hay decision tecnica sin ADR.
- Hay feature construible sin spec.
- Hay entregable incompleto sin pregunta abierta.
- Se crea documentacion fuera de ruta canonica.

## Verification evidence
- fase detectada,
- modo recomendado,
- archivos destino,
- contenido generado o propuesto,
- preguntas abiertas,
- gate aplicado,
- trazabilidad entrada -> artefacto.

## Artefactos relacionados
- `../agents/enterprise-ai-framework-agent.md`
- `../skills/documentation-orchestration.skill.md`
- `../references/documentation-orchestration.md`
- `../quality-gates/gate-documentation-ready.md`
- `../prompts/generated/README.md`
