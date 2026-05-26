# Prompt Generar Backend

## Objetivo
Pedir una propuesta o implementacion backend alineada con una `spec tecnica`.

## Usalo cuando
- una feature ya esta lista para construccion,
- necesitas bajar contratos a dominio, aplicacion e infraestructura,
- quieres validar impacto en pruebas y trazabilidad.

## No lo uses cuando
- falta `spec tecnica` o contrato base,
- el cambio pertenece principalmente a UX o discovery,
- se requiere decidir arquitectura antes de implementar.

## Entradas minimas
- `spec tecnica`,
- `spec-tareas.md` con tareas ejecutables,
- contratos y errores,
- reglas de negocio,
- arquitectura o ADR aplicables.

## Salida esperada
- componentes backend,
- endpoints, servicios o casos de uso,
- persistencia o integraciones afectadas,
- pruebas unitarias e integracion propuestas.
- evidencia TDD por tarea cuando se implementa comportamiento.

## Rutas destino
- `src/backend/`
- `tests/unit/backend/`
- `tests/integration/`

## Verificacion minima
- La propuesta o implementacion referencia la feature y la `spec tecnica`.
- Hay pruebas minimas asociadas al cambio.
- Las tareas de codigo siguen red-green-refactor o justifican por que no aplica.
- Contratos, errores, seguridad y observabilidad quedan revisados.

## Pedido base
```
Parte de la spec tecnica aprobada y de una tarea concreta de spec-tareas.md.
Define o implementa componentes backend, contratos, reglas, errores y pruebas tecnicas.
Ejecuta red-green-refactor cuando cambie comportamiento.
Mantiene trazabilidad con la feature, arquitectura y criterios de aceptacion.
```
