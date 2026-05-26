# Prompt Generar Tests

## Objetivo
Pedir pruebas automatizadas o casos QA a partir de specs, riesgos y criterios de salida.

## Usalo cuando
- una feature ya tiene alcance y contratos claros,
- necesitas bajar la validacion a unit, integration, e2e o QA,
- quieres revisar cobertura antes de release.

## No lo uses cuando
- no existen criterios de aceptacion,
- el cambio aun esta en discovery sin feature definida,
- la solicitud busca solo datos de ejemplo sin estrategia de validacion.

## Entradas minimas
- `spec funcional`,
- `spec tecnica` si existe,
- `spec-tareas.md` si la feature esta en construccion,
- criterios de aceptacion,
- riesgos o defectos conocidos.

## Salida esperada
- propuesta de pruebas por nivel,
- casos prioritarios,
- cobertura de errores y casos borde,
- criterios de salida y evidencia esperada cuando aplique.
- evidencia red-green-refactor cuando el test acompana implementacion.

## Rutas destino
- `tests/`
- `qa/fase-6-qa/casos/`
- `qa/fase-6-qa/evidencias/`

## Verificacion minima
- Las pruebas cubren happy path, errores, permisos y casos borde.
- Cada caso se vincula con criterio de aceptacion o riesgo.
- La evidencia esperada queda clara para QA o CI.
- Si el cambio ya esta implementado, se revisa si hubo prueba red antes de green o se registra justificacion.

## Pedido base
```
Toma las specs y criterios de aceptacion de la feature.
Propone pruebas unitarias, de integracion, e2e y QA segun corresponda.
Cubre flujo principal, alternos, errores, permisos y riesgos operativos.
```
