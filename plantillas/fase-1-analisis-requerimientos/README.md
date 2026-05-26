# Plantillas Fase 1 - Analisis y requerimientos

[README principal](../../README.md) | [Indice docs](../../docs/README.md) | [Volver a plantillas](../README.md)

Plantillas reutilizables para estructurar requerimientos, modulos y trazabilidad funcional.

## Plantillas disponibles
- [caso-uso.md](caso-uso.md)
- [historia-usuario.md](historia-usuario.md)
- [matriz-huecos-fase-1.md](matriz-huecos-fase-1.md)
- [modulo.md](modulo.md)
- [requerimientos-no-funcionales.md](requerimientos-no-funcionales.md)

## Regla de uso
- Usa estas plantillas para discovery y refinamiento inicial.
- El documento consolidado del proyecto debe vivir en `docs/fase-1-analisis-requerimientos/`.

## Flujo recomendado
1. Identifica capacidades con `modulo.md`.
2. Baja los flujos principales y alternos con `caso-uso.md`.
3. Levanta `RNF` explicitos con `requerimientos-no-funcionales.md`.
4. Convierte necesidades priorizadas en backlog con `historia-usuario.md`.
5. Detecta huecos con `matriz-huecos-fase-1.md`.
6. Consolida actores, modulos, `RF`, `RNF`, reglas, integraciones, casos de uso y backlog en `docs/fase-1-analisis-requerimientos/01.00-analisis-requerimientos.md`.
7. Consolida huecos, supuestos, decisiones pendientes y cobertura RN -> RF/RNF en `docs/fase-1-analisis-requerimientos/01.01-matriz-huecos-fase-1.md`.

## Regla practica: RNF vs riesgos
- `RNF`: condicion de calidad o restriccion que la solucion debe cumplir.
- `Riesgo`: amenaza, incertidumbre o condicion que podria impedir cumplir alcance, calidad, tiempo o costo.
- En fase 1, los `RNF` deben quedar visibles como parte del analisis.
- Los riesgos pueden aparecer en fase 1 si afectan modulos, alcance o discovery, pero tambien pueden vivir en fase 0, fase 3, fase 7 u operacion segun su naturaleza.

## Anti-patron a evitar
- No dejes la fase 1 solo con el esqueleto del template.
- No copies literalmente frases instructivas como contenido final del proyecto.
- No uses `ejemplos/` como reemplazo del analisis real del dominio.

## Ejemplo de referencia
- [../../ejemplos/fase-1-analisis-requerimientos/README.md](../../ejemplos/fase-1-analisis-requerimientos/README.md)
