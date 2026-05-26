# Prompt Documentar ADR

## Objetivo
Transformar una decision tecnica relevante en un ADR claro, justificable y trazable.

## Usalo cuando
- una decision estructural ya necesita quedar formalizada,
- existen trade-offs reales entre opciones,
- arquitectura, seguridad u operacion pueden verse afectadas.

## No lo uses cuando
- solo estas llenando tecnologia elegida sin decision real,
- el tema es puramente operativo y no cambia arquitectura.

## Entradas minimas
- contexto del problema,
- opciones consideradas,
- restricciones y RNF,
- decision propuesta o tomada.

## Salida esperada
- contexto,
- decision,
- alternativas,
- consecuencias,
- relacion con arquitectura y despliegue.

## Rutas destino
- `docs/fase-3-arquitectura/adr/ADR-XXX-nombre-corto.md`
- `docs/fase-3-arquitectura/03.01-decisiones-tecnologia.md`

## Verificacion minima
- La decision responde a un problema real.
- Se explican trade-offs y consecuencias.
- Existe trazabilidad a RNF, riesgos u operacion.

## Pedido base
```md
Actua como Arquitecto de Solucion con disciplina ADR.

Documenta la decision tecnica propuesta como un ADR profesional para este repositorio.

Obligatorio:
- explica el contexto y el problema,
- lista opciones relevantes,
- justifica la decision con trade-offs claros,
- incluye consecuencias, riesgos y trabajo derivado,
- no inventes aprobaciones ni estado final si aun no existen.

Entrega el contenido listo para `ADR-XXX-nombre-corto.md` y menciona que documentos de fase 3 deben actualizarse tambien.
```
