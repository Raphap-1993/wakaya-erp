# Prompt Generar Frontend

## Objetivo
Pedir una propuesta o implementacion frontend a partir de UX, prototipo validado, `spec funcional`, criterios UI y contratos.

## Usalo cuando
- la UI ya tiene flujo definido,
- necesitas bajar pantallas, estados y validaciones al frontend,
- quieres mantener consistencia entre UX, backend y QA.

## No lo uses cuando
- todavia no existe UX, journey o criterio de aceptacion,
- el cambio real es de backend o arquitectura,
- el proyecto Angular no esta definido como workspace Nx cuando aplique.

## Entradas minimas
- definicion UX/UI,
- prototipo validado o link/export Penpot cuando aplique,
- sistema de componentes o criterios UI,
- `spec funcional`,
- `spec-tareas.md` con tareas ejecutables,
- contratos backend o `spec tecnica`,
- reglas de validacion y errores.

## Salida esperada
- modulos frontend,
- estados de carga, vacio y error,
- formularios, tablas o vistas necesarias,
- pruebas unitarias o e2e propuestas.
- evidencia TDD o de prueba de componente por tarea.
- diferencias contra prototipo registradas si existen.

## Rutas destino
- `src/frontend/`
- `tests/unit/frontend/`
- `tests/e2e/`

## Verificacion minima
- La salida cubre estados de carga, vacio, error y permisos.
- Las pruebas propuestas cubren flujo principal y casos borde.
- Las tareas de codigo siguen red-green-refactor o justifican por que no aplica.
- La UI queda trazada a UX, spec funcional y contratos.
- Los componentes respetan el sistema de componentes, criterios UI y trazabilidad SPDD.

## Pedido base
```
Lee UX, prototipo validado, criterios UI, spec funcional y contratos disponibles.
Selecciona una tarea concreta de spec-tareas.md.
Define o implementa la solucion frontend incluyendo estados, validaciones, errores y pruebas.
Ejecuta red-green-refactor cuando cambie comportamiento.
Mantiene trazabilidad explicita con la feature, el prototipo y los criterios de aceptacion.
```
