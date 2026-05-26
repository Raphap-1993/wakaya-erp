# Prompt Transformar Idea A Documentacion Inicial

## Objetivo
Transformar una idea bruta en borradores iniciales profesionales por fases `0-3`, usando las rutas canonicas del repositorio.

## Usalo cuando
- el proyecto todavia no tiene discovery formal,
- solo existe una idea, problema, oportunidad o nota de contexto,
- el Product Owner necesita convertir esa entrada en una base documental inicial.

## No lo uses cuando
- ya existe fase 1 aprobada y la necesidad es SDD de una feature puntual,
- la solicitud pide implementar codigo,
- no habra validacion humana de supuestos y preguntas abiertas.

## Entradas minimas
- idea bruta en texto libre,
- objetivo de negocio si ya existe,
- restricciones conocidas,
- actores visibles o area usuaria si ya se conocen.

## Salida esperada
- resumen ejecutivo de la idea,
- problema, actores, objetivos, riesgos y huecos,
- borradores iniciales por fase y por archivo,
- preguntas abiertas y siguiente paso recomendado.

## Rutas destino
- `docs/fase-0-iniciacion/00.01-vision-proyecto.md`
- `docs/fase-0-iniciacion/00.02-roadmap.md`
- `docs/fase-0-iniciacion/00.03-estimacion-tiempo-costo.md`
- `docs/fase-0-iniciacion/00.04-roles-y-responsabilidades.md`
- `docs/fase-1-analisis-requerimientos/01.00-analisis-requerimientos.md`
- `docs/fase-2-ux-ui/02.00-ux-ui.md`
- `docs/fase-3-arquitectura/03.00-arquitectura.md`
- `docs/fase-3-arquitectura/03.01-decisiones-tecnologia.md`
- `docs/fase-3-arquitectura/03.03-plan-despliegue.md`

## Verificacion minima
- La salida separa problema, actores, objetivos, riesgos y huecos.
- Cada borrador indica supuestos y pendientes por validar.
- Las decisiones tecnologicas quedan como propuesta, no como decision aprobada.

## Pedido base
```md
Actua como Product Owner + Business Analyst + facilitador de discovery AI-first.

Tu objetivo es transformar una idea bruta en documentacion inicial por fases para este repositorio, siguiendo la estructura canonica del proyecto.

Reglas:
- No escribas codigo.
- No inventes decisiones tecnologicas cerradas sin marcar que son propuestas.
- Si faltan datos, explicitalos como supuestos o preguntas abiertas.
- Organiza la salida por fases 0, 1, 2 y 3.
- Usa nombres de archivos reales del repositorio.
- La salida debe servir como borrador inicial profesional, no como texto inspiracional.

Flujo esperado:
Idea bruta
-> IA estructura problema, actores, objetivos, riesgos y huecos
-> IA genera borradores iniciales por fases
-> IA deja preguntas abiertas y siguientes pasos

Genera borradores iniciales para estas rutas:

Fase 0
- docs/fase-0-iniciacion/00.01-vision-proyecto.md
- docs/fase-0-iniciacion/00.02-roadmap.md
- docs/fase-0-iniciacion/00.03-estimacion-tiempo-costo.md
- docs/fase-0-iniciacion/00.04-roles-y-responsabilidades.md

Fase 1
- docs/fase-1-analisis-requerimientos/01.00-analisis-requerimientos.md

Fase 2
- docs/fase-2-ux-ui/02.00-ux-ui.md

Fase 3
- docs/fase-3-arquitectura/03.00-arquitectura.md
- docs/fase-3-arquitectura/03.01-decisiones-tecnologia.md
- docs/fase-3-arquitectura/03.03-plan-despliegue.md

Formato de salida obligatorio:
1. Resumen ejecutivo de la idea
2. Problema a resolver
3. Actores involucrados
4. Objetivos de negocio
5. Riesgos y restricciones
6. Huecos de informacion que deben validarse
7. Borradores iniciales por fase y por archivo
8. Preguntas abiertas
9. Proximo paso recomendado

Para cada archivo genera:
- Objetivo del documento
- Borrador inicial
- Supuestos
- Pendientes por validar

Idea bruta a transformar:
{{PEGAR_AQUI_LA_IDEA}}
```
