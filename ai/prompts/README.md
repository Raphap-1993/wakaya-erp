# Prompts

[README principal](../../README.md) | [Indice docs](../../docs/README.md) | [Volver a ai](../README.md)

Prompts son instrucciones reutilizables para pedir una salida concreta sobre un artefacto o fase.

## Regla de uso
- Usa un `prompt` cuando ya sabes exactamente que entregable quieres producir o actualizar.
- El prompt no sustituye el documento oficial: debe ayudar a completarlo o revisarlo.
- Toda salida debe declarar entradas, rutas destino y criterios de consistencia.
- Si el proyecto parte de una idea cruda, usa primero un prompt de estructuracion antes de bajar a prompts mas especificos por fase.
- Un prompt oficial debe dejar claro tambien cuando no usarlo y como verificar su salida.

## Anatomia minima recomendada
- objetivo,
- usalo cuando,
- no lo uses cuando,
- entradas minimas,
- salida esperada,
- rutas destino,
- verificacion minima,
- pedido base.

## Uso en proyecto real
- Los prompts oficiales del proyecto deben pedir entregables alineados con el dominio, el stack y las rutas reales adoptadas.
- Si partes de un prompt base de la plantilla, ajusta entradas, restricciones y salida esperada antes de usarlo como artefacto oficial.
- Un prompt del proyecto no debe seguir hablando del caso canonico si el proyecto real ya tiene otro alcance.
- Si la solicitud no esta clara, usa primero `../skills/using-project-skills.skill.md`.

## Anti-patron a evitar
- Copiar prompts de ejemplo sin cambiar contexto, actores, rutas o restricciones.
- Pedir salidas genericas sin indicar el artefacto oficial que se va a producir o actualizar.

## Prompts disponibles
- [arranque-desde-fuente-bruta.md](arranque-desde-fuente-bruta.md) ← punto de entrada principal
- [orquestar-framework-enterprise-ai-first.md](orquestar-framework-enterprise-ai-first.md)
- [crear-proyecto-real-desde-template.md](crear-proyecto-real-desde-template.md)
- [estimar-proyecto.md](estimar-proyecto.md)
- [transformar-idea-a-documentacion-inicial.md](transformar-idea-a-documentacion-inicial.md)
- [refinar-requerimientos.md](refinar-requerimientos.md)
- [estructurar-ux-desde-markdown.md](estructurar-ux-desde-markdown.md)
- [generar-prototipo-html5-ejecutable.md](generar-prototipo-html5-ejecutable.md) ← **usar este para HTML5** (6 pasos, checklist de salida, mas compacto)
- [generar-prototipo-html5-desde-spdd.md](generar-prototipo-html5-desde-spdd.md) ← referencia completa con todas las reglas
- [generar-prototipo-penpot-desde-spdd.md](generar-prototipo-penpot-desde-spdd.md)
- [generar-arquitectura.md](generar-arquitectura.md)
- [generar-c4.md](generar-c4.md)
- [documentar-adr.md](documentar-adr.md)
- [generar-spec-funcional.md](generar-spec-funcional.md)
- [generar-spec-tecnica.md](generar-spec-tecnica.md)
- [generar-backend.md](generar-backend.md)
- [generar-frontend.md](generar-frontend.md)
- [generar-tests.md](generar-tests.md)
- [preparar-release.md](preparar-release.md)
- [revisar-operacion.md](revisar-operacion.md)

## Nota sobre prompts HTML5
Usar `generar-prototipo-html5-ejecutable.md` como prompt principal de ejecucion. Es mas corto, mas imperativo y tiene checklist de salida obligatorio. El prompt completo `generar-prototipo-html5-desde-spdd.md` sirve como referencia de reglas detalladas.

## Prompts generados
- [generated/README.md](generated/README.md)

## Lifecycle sugerido
- `/plan`: discovery, requerimientos, UX o arquitectura base.
- `/prototype`: prototipo HTML5 o Penpot desde SPDD.
- `/spec`: conversion de backlog a specs.
- `/build`: implementacion minima trazable.
- `/test`: evidencia QA y browser testing.
- `/review`: revision de consistencia, riesgo o salud.
- `/ship`: release readiness y launch controlado.
