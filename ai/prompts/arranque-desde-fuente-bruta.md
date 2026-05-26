# Prompt Arranque desde fuente bruta

## Objetivo
Convertir informacion cruda y desordenada en documentacion inicial util para decidir si el proyecto esta listo para instanciarse desde el template.

Este prompt es de **intake/documentacion**, no de bootstrap tecnico. No debe crear repositorios, ejecutar `create-project` ni asumir que ya existe una ruta destino lista para escribir.

## Usalo cuando
- tienes notas, entrevistas, correos, audios transcritos, actas, backlog preliminar o texto libre,
- el problema, alcance, usuarios o restricciones todavia estan ambiguos,
- necesitas extraer RF/RNF, actores, supuestos, riesgos y preguntas abiertas,
- quieres preparar insumos para `crear-proyecto-real-desde-template.md` o para el runbook `crear-proyecto-real-con-agente.md`.

## No lo uses cuando
- ya tienes nombre, dominio, stack, ruta destino y config listos para instanciar,
- necesitas ejecutar `scripts/ai-framework-agent.mjs create-project`,
- el proyecto real ya existe y solo necesitas avanzar una fase concreta,
- el objetivo es construir codigo.

## Relacion con otros flujos
```text
Fuente bruta
  -> arranque-desde-fuente-bruta.md
  -> vision inicial + RF/RNF + supuestos + preguntas + features candidatas
  -> crear-proyecto-real-desde-template.md o crear-proyecto-real-con-agente.md
```

Si el usuario quiere guia end-to-end con preguntas, gates y creacion del proyecto, usa [ai/runbooks/crear-proyecto-real-con-agente.md](../runbooks/crear-proyecto-real-con-agente.md).

Si ya existen datos minimos claros para crear el proyecto, usa [crear-proyecto-real-desde-template.md](crear-proyecto-real-desde-template.md).

## Entradas minimas
- ruta o contenido de la fuente bruta,
- contexto conocido del negocio,
- restricciones conocidas si existen,
- formato de salida deseado: resumen, documentos iniciales o insumos para config.

## Salidas esperadas
- vision inicial del proyecto,
- problema y objetivo principal,
- actores y usuarios,
- RF/RNF preliminares,
- restricciones tecnicas y de negocio,
- supuestos marcados como `SUPUESTO:`,
- preguntas abiertas criticas,
- riesgos iniciales,
- features candidatas,
- recomendacion de siguiente modo de trabajo.

## Pedido base

```md
Actua como Enterprise AI Framework Agent en modo intake desde fuente bruta.

Usa como referencia:
- AGENTS.md
- docs/transversal/90.13-modos-de-trabajo.md
- docs/fase-0-iniciacion/00.10-idea-a-documentacion-inicial-con-ia.md
- ai/commands/document-command.md
- ai/skills/documentation-orchestration.skill.md
- ai/skills/requirements-quality.skill.md

Fuente bruta:
{{RUTA_O_CONTENIDO_FUENTE_BRUTA}}

Tarea:
1. Lee la fuente bruta.
2. Extrae nombre tentativo del proyecto y dominio de negocio.
3. Describe problema, objetivo principal y alcance preliminar.
4. Identifica actores y usuarios.
5. Lista requerimientos funcionales preliminares como RF-01, RF-02...
6. Lista requerimientos no funcionales preliminares como RNF-01, RNF-02...
7. Identifica restricciones tecnicas conocidas.
8. Identifica restricciones de negocio.
9. Declara `SUPUESTO:` para todo lo no confirmado.
10. Declara preguntas abiertas criticas.
11. Propone features candidatas sin crear specs finales.
12. Recomienda siguiente modo:
    - seguir discovery,
    - instanciar desde template,
    - usar agente guiado,
    - preparar Product Design/SPDD.

No ejecutes scripts.
No crees repositorio.
No declares gates aprobados.
No construyas codigo.

Salida:
- resumen ejecutivo,
- tabla RF/RNF,
- supuestos,
- preguntas abiertas,
- riesgos,
- features candidatas,
- siguiente paso recomendado.
```

## Artefactos sugeridos si el usuario pide guardar archivos
- `docs/fase-0-iniciacion/00.01-vision-proyecto.md`
- `docs/fase-1-analisis-requerimientos/01.00-analisis-requerimientos.md`
- `specs/README.md` con features candidatas, no specs cerradas

Si necesitas separar preguntas, supuestos o riesgos, agregalos como secciones dentro de los documentos anteriores o crea rutas nuevas solo despues de acordarlas con el equipo.

## Red flags a vigilar
- La fuente bruta no tiene actor ni problema claro.
- La fuente mezcla varios productos sin separarlos.
- La fuente contiene decisiones tecnicas no justificadas.
- Hay menores, datos sensibles, regulacion o compliance sin RNF explicitos.
- Se intenta saltar de fuente bruta a construccion.
- Se intenta aprobar gates solo con texto crudo.

## Verificacion minima
- Fuente bruta leida y resumida.
- RF/RNF/actores/restricciones identificados.
- Supuestos y preguntas abiertas separados de hechos.
- No se ejecuto create-project.
- No se marco ningun gate como aprobado.
- Hay recomendacion clara del siguiente modo de trabajo.

## Referencias
- [ai/runbooks/crear-proyecto-real-con-agente.md](../runbooks/crear-proyecto-real-con-agente.md)
- [ai/prompts/crear-proyecto-real-desde-template.md](crear-proyecto-real-desde-template.md)
- [ai/prompts/transformar-idea-a-documentacion-inicial.md](transformar-idea-a-documentacion-inicial.md)
- [docs/transversal/90.13-modos-de-trabajo.md](../../docs/transversal/90.13-modos-de-trabajo.md)
- [docs/transversal/90.33-flujo-delivery-ia-proveedores.md](../../docs/transversal/90.33-flujo-delivery-ia-proveedores.md)
