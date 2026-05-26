# Skill Source-Driven Development

## Objetivo
Mantener la implementacion alineada al codigo, contratos y pruebas reales, evitando deriva entre spec y source.

## Aplicala cuando
- una feature ya esta en construccion,
- el codigo existente impone limites o integraciones reales,
- hace falta ajustar specs segun lo aprendido del source.

## No la apliques cuando
- todavia no existen specs minimas,
- el trabajo sigue siendo discovery de alto nivel.

## Entradas minimas
- specs de la feature,
- codigo afectado,
- pruebas actuales.

## Flujo recomendado
1. Lee specs y source real.
2. Detecta donde el source contradice o matiza la spec.
3. Ajusta implementacion o trazabilidad sin ocultar el desvio.
4. Actualiza pruebas y documentacion derivada.

## Anti-rationalizations
| Excusa | Respuesta |
|---|---|
| El source manda, luego vemos la spec | Si cambia el comportamiento, la spec debe actualizarse |
| Nadie usa esa ruta | Si existe en el source, hay que validar su impacto |

## Red flags
- El codigo ya no refleja la spec.
- Se cambiaron contratos sin actualizar pruebas.
- Se parchea comportamiento sin trazabilidad.

## Verification evidence
- archivos de codigo revisados,
- archivos de prueba ajustados,
- spec o trazabilidad actualizada si hacia falta.

## Referencias
- `../references/documentation-and-traceability.md`
