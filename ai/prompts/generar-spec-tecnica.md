# Prompt Generar Spec Tecnica

## Objetivo
Derivar una `spec tecnica` a partir de la `spec funcional` y la arquitectura vigente.

## Usalo cuando
- la feature ya tiene alcance funcional claro,
- necesitas contratos, componentes, errores, seguridad y pruebas,
- quieres dejar una feature lista para construir.

## No lo uses cuando
- no existe `spec funcional` aprobada o revisable,
- la arquitectura base aun no existe,
- la salida no podra actualizar contratos, pruebas o riesgos.

## Entradas minimas
- `spec funcional`,
- arquitectura y ADR aplicables,
- RNF y restricciones tecnicas,
- integraciones o dependencias.

## Salida esperada
- componentes afectados,
- contratos y errores,
- seguridad, observabilidad y riesgos,
- estrategia de pruebas tecnica.

## Rutas destino
- `specs/<nnn-feature>/spec-tecnica.md`

## Verificacion minima
- La spec tecnica cubre componentes, contratos, errores, seguridad y observabilidad.
- Hay estrategia de pruebas alineada al riesgo.
- Cualquier decision nueva queda marcada para ADR o fase 3.

## Pedido base
```
Lee la spec funcional y la arquitectura vigente.
Deriva una spec tecnica con contratos, componentes, errores, seguridad, observabilidad, dependencias y riesgos.
Incluye estrategia de pruebas y deja trazabilidad hacia arquitectura y requerimientos.
```
