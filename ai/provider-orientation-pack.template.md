# Provider Orientation Pack - {{NOMBRE_PROYECTO}}

> **ATENCION para proveedores IA:**
> Este archivo es el punto de entrada obligatorio antes de tomar cualquier tarea en este proyecto.
> Leelo antes de ejecutar cualquier comando, crear cualquier archivo o iniciar construccion.

## Identidad del proyecto
| Campo | Valor |
|---|---|
| Nombre | {{NOMBRE_PROYECTO}} |
| Dominio de negocio | {{DOMINIO}} |
| Stack | {{STACK}} |
| Fase actual | {{FASE_ACTUAL}} |
| Fecha de instanciacion | {{FECHA}} |
| Template base | project-template v{{VERSION_TEMPLATE}} |

## Estado de gates - actualizar en cada sesion

| Gate | Estado | Razon / Bloqueante | Proximo paso |
|---|---|---|---|
| gate-0-1 | PENDIENTE | vision y requerimientos generados, requieren validacion humana | Revisar con stakeholders |
| gate-ux-ready | PENDIENTE | product-design borrador, requiere revision humana | Completar Product Design |
| gate-prototype-ready | PENDIENTE | no existe prototipo HTML5/Penpot revisable o excepcion aprobada | Crear prototipo con `/prototype` |
| gate-spdd-approved | PENDIENTE | no existe prototipo validado humanamente | Validar prototipo y registrar decision |
| gate-2-3 | PENDIENTE | arquitectura como propuesta, ADR sin aprobar | Revisar arquitectura con equipo tecnico |
| gate-4-6 | NO APLICA | construccion no iniciada | No aplica hasta SDD aprobado |
| gate-7-8 | NO APLICA | deploy no iniciado | No aplica hasta QA/release |

> Para aprobar un gate se requiere validacion humana explicita.
> No asumir ningun gate como aprobado hasta que aparezca `APROBADO` en esta tabla con fecha y firmante.

## Proximos pasos (en orden estricto)

```text
1. [ ] Validar vision y requerimientos con stakeholders
       -> Artefacto: docs/fase-0-iniciacion/00.01-vision-proyecto.md
       -> Gate: gate-0-1

2. [ ] Completar Product Design de todas las features del incremento 1
       -> Artefacto: specs/<feature>/product-design.md
       -> Gate: gate-ux-ready

3. [ ] Crear prototipo HTML5 rapido o Penpot formal para cada feature visual
       -> Artefactos: specs/<feature>/prototype.md, prototype-validation.md, prototype-html5/ o link/export Penpot
       -> Gate: gate-prototype-ready

4. [ ] Validar prototipo con negocio/UX
       -> Artefacto: specs/<feature>/prototype-validation.md
       -> Gate: gate-spdd-approved

5. [ ] Ejecutar /spec para cerrar SDD (SOLO despues de gate-spdd-approved)
       -> Artefactos: spec-funcional.md, spec-tecnica.md, api-contract.md, spec-tareas.md, traceability.md

6. [ ] Ejecutar /build (SOLO despues de gate-spdd-approved y /spec completo)
```

## Lo que NO debe hacerse ahora

- **NO iniciar construccion productiva** - gate-spdd-approved esta PENDIENTE.
- **NO cerrar spec-funcional.md ni spec-tecnica.md** sin prototipo validado para features visuales.
- **NO tratar prototipo HTML5 como frontend productivo**.
- **NO tratar prompt Penpot como prototipo aprobado**.
- **NO conectar API real** si solo existe prototipo HTML5/Penpot; primero cerrar SDD.
- **NO asumir decisiones de arquitectura como aprobadas** - los ADR estan como propuesta.
- **NO crear features nuevas** hasta cerrar las features del incremento 1.

## Features del proyecto real (dominio: {{DOMINIO}})

> Estas son las features REALES del proyecto, no del template canonico.

| # | Feature | Estado | Gate actual |
|---|---|---|---|
| 001 | {{FEATURE_001}} | Borrador product-design | gate-ux-ready PENDIENTE |
| 002 | {{FEATURE_002}} | Borrador product-design | gate-ux-ready PENDIENTE |

## Comandos IA disponibles

Ver `ai/commands/` para los archivos operativos de cada comando:

| Command | Archivo | Usar cuando |
|---|---|---|
| `/document` | `ai/commands/document-command.md` | documentar, actualizar artefactos oficiales |
| `/ux` | `ai/commands/ux-command.md` | Product Design y SPDD inicial |
| `/prototype` | `ai/commands/prototype-command.md` | prototipo HTML5/Penpot y gate-prototype-ready |
| `/spec` | `ai/commands/spec-command.md` | cerrar SDD (requiere gate-spdd-approved si hay UI) |
| `/build` | `ai/commands/build-command.md` | construccion (requiere gate-spdd-approved + /spec) |
| `/test` | `ai/commands/test-command.md` | QA y evidencia |
| `/review` | `ai/commands/review-command.md` | revision de artefactos, prototipo, gates y codigo |
| `/ship` | `ai/commands/ship-command.md` | release y deploy |
| `/plan` | `ai/commands/plan-command.md` | planificacion y estimacion |

## Skills activas en este proyecto

Ver `ai/skills/` para el listado completo. Skills criticas para este dominio:

| Skill | Archivo | Aplica en |
|---|---|---|
| Spec-Driven Product Design | `spec-driven-product-design.skill.md` | fase 2 |
| HTML5 Prototyping | `html5-prototyping.skill.md` | fase 2 |
| Penpot AI Prototyping | `penpot-ai-prototyping.skill.md` | fase 2 |
| SPDD Frontend | `spec-prototype-driven-frontend.skill.md` | fases 2-5 |
| Backend | `backend.skill.md` | fase 5 |
| Frontend | `frontend.skill.md` | fase 5 |
| Security Hardening | `security-hardening.skill.md` | fases 3-5 |
| Browser Testing | `browser-testing.skill.md` | fase 6 |
| Test-Driven Development | `test-driven-development.skill.md` | fases 5-6 |

## Artefactos clave del proyecto

| Artefacto | Ruta | Estado |
|---|---|---|
| Vision del proyecto | `docs/fase-0-iniciacion/00.01-vision-proyecto.md` | Borrador |
| Requerimientos | `docs/fase-1-analisis-requerimientos/01.00-analisis-requerimientos.md` | Borrador |
| Product Design fase 2 | `docs/fase-2-ux-ui/02.09-spec-driven-product-design.md` | Borrador |
| Product Design feature 001 | `specs/{{FEATURE_001}}/product-design.md` | Borrador |
| SPDD feature 001 | `specs/{{FEATURE_001}}/spdd-frontend.md` | Borrador |
| Prototipo feature 001 | `specs/{{FEATURE_001}}/prototype.md` | PENDIENTE |
| Validacion prototipo feature 001 | `specs/{{FEATURE_001}}/prototype-validation.md` | PENDIENTE |
| OpenAPI | `contracts/api/openapi.yaml` | Borrador |
| Arquitectura | `docs/fase-3-arquitectura/03.00-arquitectura.md` | Propuesta |

## Convenciones del dominio

- Prefijo de permisos: `{{PREFIJO}}_READ`, `{{PREFIJO}}_WRITE`, etc.
- Marcar con `SUPUESTO:` todo lo no confirmado en la fuente bruta.
- Marcar con `PENDIENTE:` todo lo que requiere validacion humana.
- Toda decision tecnica cerrada requiere ADR en `docs/fase-3-arquitectura/adr/`.

## Contacto y responsables

| Rol | Responsable | Canal |
|---|---|---|
| Product Owner | PENDIENTE | PENDIENTE |
| Tech Lead | PENDIENTE | PENDIENTE |
| UX Lead | PENDIENTE | PENDIENTE |

---

*Generado por Enterprise AI Framework Agent - {{FECHA}}*
*Actualizar este archivo al inicio de cada sesion con el estado real de gates.*
