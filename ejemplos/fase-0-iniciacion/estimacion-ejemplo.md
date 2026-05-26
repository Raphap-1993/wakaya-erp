# Ejemplo de estimacion

## Supuestos
- Equipo base de 6 personas.
- MVP con alcance cerrado por 4 meses.
- Infraestructura on-premise existente.

## Escenario seleccionado
MVP on-premise con monolito modular.

## Stack seleccionado
Angular 21 en Nx, Quarkus, PostgreSQL, Keycloak y Docker.

## Equipo
- 1 BA
- 1 UX
- 1 ARQ/TL
- 1 FE
- 1 BE
- 1 QA

## Capacidad por rol
- Dedicación completa en construcción para FE y BE.
- QA al 50 por ciento hasta la fase 5 y al 100 por ciento desde fase 6.

## Esfuerzo por fase
- Iniciación y análisis: 3 semanas.
- UX y arquitectura: 4 semanas.
- SDD: 1 semana inicial para `001`, `002` y `003`, con refinamiento continuo.
- Construcción: 7 semanas para bandeja operativa, cambio de estado auditado e historial visible.
- QA y deploy: 3 semanas.

## Costo por fase
- Discovery y análisis: 5,500
- UX y arquitectura: 7,000
- Construcción: 18,000
- QA y deploy: 6,500

## Riesgos de estimación
- Cambio de alcance por nuevas reglas regulatorias.
- Dependencia de IAM corporativo.
- Madurez desigual del equipo en despliegue on-premise.
- Complejidad de reglas de negocio en cierres y reaperturas de expediente.
- Riesgo de inconsistencia entre historial visible y auditoria real si no se diseña como feature explicita.

## Contingencia
15 por ciento sobre costo total estimado.
