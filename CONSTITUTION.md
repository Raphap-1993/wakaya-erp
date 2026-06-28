# CONSTITUTION

## Proposito

Esta constitucion define los principios no negociables para Wakaya ERP. Su
funcion es impedir que el proyecto aparente avance cuando todavia no tiene
evidencia, aprobaciones o controles suficientes para sostener una salida real.

## Principio 1 - El dominio real manda

Wakaya ERP se construye sobre el dominio real `reservations`. Ningun artefacto
canonico puede volver a basarse en el template de expedientes, bandeja o gestion
documental como si fuera el producto actual, porque eso contamina specs,
trazabilidad y decisiones tecnicas.

Lo hace cumplir: `AGENTS.md`, `npm run check:prototype-domain-mismatch`,
`npm run check:trace-drift` y revisiones humanas de arquitectura.

## Principio 2 - No se construye sin spec ejecutable

Todo slice funcional debe partir de `spec-funcional.md`, `spec-tecnica.md`,
`traceability.md` y `spec-tareas.md` cuando aplique. El codigo no puede ser la
fuente primaria de verdad ni reemplazar definiciones funcionales o tecnicas.

Lo hace cumplir: `AGENTS.md`, `npm run check:phase-contract`,
`npm run check:api-documented`, `npm run check:bd-documented`.

## Principio 3 - Lo visual requiere prototipo y aprobacion humana

Una feature visual no avanza de UX/SPDD a construccion solo porque tenga HTML o
mockups. Necesita prototipo revisable, evidencia de validacion y aprobacion
humana explicita antes de tratarse como base productiva.

Lo hace cumplir: `npm run roadmap:status`, `npm run check:prototype-contract`,
`npm run check:prototype-coverage`, `npm run check:prototype-portfolio`.

## Principio 4 - La trazabilidad debe corresponder al repo real

Cada RF/RNF declarado como implementado o validado debe enlazar codigo, test y
evidencia que existan de verdad en el arbol del proyecto. Si la matriz miente,
el estado del proyecto deja de ser confiable aunque haya codigo funcionando.

Lo hace cumplir: `npm run check:trace-drift`, `npm run check:status-coherence`,
`npm run check:test-documented`, `npm run check:trace-coverage`.

## Principio 5 - La seguridad no es opcional

Autenticacion, autorizacion RBAC, manejo de secretos y redaccion de PII forman
parte del baseline minimo. No se aceptan atajos que dejen endpoints o flujos
operativos fuera del modelo de seguridad esperado.

Lo hace cumplir: `npm run check:architecture-baseline`,
`docs/fase-3-arquitectura/03.08-auth-authz.md`, revisiones humanas de seguridad.

## Principio 6 - QA requiere evidencia, no declaraciones

Una funcionalidad no se considera lista porque "parece funcionar". Debe tener
tests automatizados, evidencia vinculada al RF y una lectura honesta del estado
real de cobertura y riesgos residuales.

Lo hace cumplir: `npm run test`, `npm run check:test-documented`,
`npm run check:evidence-exists`, `npm run check:runbook-binding`.

## Principio 7 - El deploy necesita rollback y gobernanza

Ninguna salida a entornos reales se considera aceptable si no puede explicarse
que version sale, como se revierte, que monitoreo la cubre y que gates humanos
aprueban la promocion. Un build verde por si solo no autoriza release.

Lo hace cumplir: `npm run check:release-binding`,
`npm run check:runbook-documented`, `npm run check:runbook-binding`,
checklists humanos de Fase 7 y Fase 8.

## Principio 8 - La arquitectura viva debe reflejar el baseline real

La documentacion de arquitectura y ADRs deben describir el stack que de verdad
corre en el repo y en los entornos previstos. Mantener Angular, Quarkus o
supuestos legacy cuando el baseline actual es otro introduce decisiones falsas.

Lo hace cumplir: `npm run check:architecture-baseline`, ADRs canonicos,
auditorias de gobernanza y revisiones humanas de arquitectura.

## Principio 9 - El pipeline debe ser completo y honesto

Si existe un validador fisico obligatorio, debe participar en el pipeline
principal o estar justificado como excepcion. No se aceptan checks criticos
presentes en el repo pero ausentes del flujo de validacion del proyecto.

Lo hace cumplir: `npm run check:validation-coverage`,
`node ci/scripts/check-constitution.mjs`, revisiones de `package.json`.

## Principio 10 - El contexto operativo debe mantenerse al dia

`AI_CONTEXT.md`, `SESSION_LOG.md`, matrices de trazabilidad y artefactos de
handoff deben describir el foco activo real. Si el repo cambia y la memoria
curada no cambia, el siguiente agente arranca desde una verdad vieja.

Lo hace cumplir: `node scripts/ai-framework-agent.mjs sync-memory`,
`npm run check:auto-zones`, auditorias de handoff y disciplina de cierre.

## Cumplimiento

La validacion total del proyecto se expresa en `npm run check:all`, que debe
mantener verdes `check:template` y `check:project` sobre el estado real del
repo. Ningun cierre metodologico, entrega o release debe declararse completo si
`npm run check:all` sigue rojo o si los gates humanos obligatorios no estan
aprobados.
