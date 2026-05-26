# Prompt Estimar Proyecto

## Objetivo
Pedir una estimacion resumida o detallada por fases, esfuerzo, equipo y riesgos.

## Usalo cuando
- el proyecto esta en fase 0,
- necesitas una actualizacion de esfuerzo,
- quieres contrastar alcance contra capacidad real del equipo.

## No lo uses cuando
- no existe vision, alcance ni backlog minimo,
- se necesita una estimacion contractual cerrada sin supuestos validados,
- el trabajo real es descomponer una feature en tareas SDD.

## Entradas minimas
- vision,
- alcance o backlog inicial,
- restricciones de tiempo y entorno,
- roles disponibles.

## Salida esperada
- estimacion por fase o feature,
- supuestos principales,
- riesgos y dependencias,
- propuesta de staffing.

## Rutas destino
- `docs/fase-0-iniciacion/00.03-estimacion-tiempo-costo.md`

## Verificacion minima
- La estimacion declara supuestos y exclusiones.
- El esfuerzo queda separado por fase o bloque de trabajo.
- Riesgos, dependencias y staffing minimo quedan visibles.

## Pedido base
```
Lee vision, alcance y restricciones del proyecto.
Estima tiempo, equipo y costo por fase.
Declara supuestos, riesgos y dependencias.
Entrega una salida util para actualizar la ruta canonica de estimacion.
```

